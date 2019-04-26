import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { SidePanel } from '@aragon/ui'
import { Transition, animated } from 'react-spring'
import ConfirmTransaction from './ConfirmTransaction'
import ConfirmMsgSign from './ConfirmMsgSign'
import SigningStatus from './SigningStatus'
import ValidateWalletWeb3 from './ValidateWalletWeb3'
import {
  STATUS_TX_CONFIRMING,
  STATUS_TX_SIGNING,
  STATUS_TX_SIGNED,
  STATUS_TX_ERROR,
  STATUS_MSG_CONFIRMING,
  STATUS_MSG_SIGNING,
  STATUS_MSG_SIGNED,
  STATUS_MSG_ERROR,
  isTxSignerStatus,
  isConfirmingSignature,
  isSignatureSuccess,
} from './signer-statuses'
import { ActivityContext } from '../../contexts/ActivityContext'
import { network } from '../../environment'
import { AppType, EthereumAddressType } from '../../prop-types'
import springs from '../../springs'
import { addressesEqual, getInjectedProvider } from '../../web3-utils'

const INITIAL_STATE = {
  panelOpened: false,
  intent: {},
  directPath: false,
  actionPaths: [],
  pretransaction: null,
  status: STATUS_TX_CONFIRMING, // initially default to rendering the tx signing panel
  signError: null,
}

const RECIEPT_ERROR_STATUS = '0x0'

const getPretransactionDescription = intent =>
  `Allow ${intent.name} to ${intent.description.slice(0, 1).toLowerCase() +
    intent.description.slice(1)}`

class SignerPanel extends React.PureComponent {
  static propTypes = {
    apps: PropTypes.arrayOf(AppType).isRequired,
    account: EthereumAddressType,
    dao: PropTypes.string,
    onRequestEnable: PropTypes.func.isRequired,
    addTransactionActivity: PropTypes.func.isRequired,
    setActivityConfirmed: PropTypes.func.isRequired,
    setActivityFailed: PropTypes.func.isRequired,
    setActivityNonce: PropTypes.func.isRequired,
    transactionBag: PropTypes.object,
    signatureBag: PropTypes.object,
    walletNetwork: PropTypes.string.isRequired,
    walletWeb3: PropTypes.object.isRequired,
    web3: PropTypes.object.isRequired,
    walletProviderId: PropTypes.string.isRequired,
  }

  state = { ...INITIAL_STATE }

  componentWillReceiveProps({ transactionBag, signatureBag }) {
    // Received a new transaction to sign
    const receivedTransactionBag =
      transactionBag && transactionBag !== this.props.transactionBag
    if (receivedTransactionBag) {
      this.setState({
        ...INITIAL_STATE,
        panelOpened: true,
        status: STATUS_TX_CONFIRMING,

        // When Aragon.js starts returning the new format (see
        // stateFromTransactionBag), we can simply search and replace this
        // function with `transactionBag`.
        ...this.stateFromTransactionBag(transactionBag),
      })
    }

    // Received a new message to sign
    const receivedSignatureBag =
      signatureBag && signatureBag !== this.props.signatureBag
    if (receivedSignatureBag) {
      this.setState({
        ...INITIAL_STATE,
        panelOpened: true,
        status: STATUS_MSG_CONFIRMING,
        ...this.stateFromMsgSigBag(signatureBag),
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { status } = this.state
    if (prevState.status !== status && !isSignatureSuccess(status)) {
      clearTimeout(this._closeTimer)
    }
  }

  // This is a temporary method to reshape the transaction bag
  // to the future format we expect from Aragon.js
  stateFromTransactionBag(bag) {
    const { path, transaction } = bag
    return {
      intent: (transaction && this.transactionIntent(bag)) || {},
      directPath: path.length === 1,
      actionPaths: path.length ? [path] : [],
      pretransaction: (transaction && transaction.pretransaction) || null,
    }
  }

  stateFromMsgSigBag({ requestingApp, message }) {
    const messageToSign = message || ''
    return {
      intent: {
        description:
          'You are about to sign this message with the connected account',
        message: messageToSign,
        requestingApp,
      },
    }
  }

  transactionIntent({ path, transaction = {} }) {
    if (path.length > 1) {
      // If the path includes forwarders, the intent is always the last node
      const lastNode = path[path.length - 1]
      const { description, name, to, annotatedDescription } = lastNode
      return { annotatedDescription, description, name, to, transaction }
    }

    // Direct path
    const { apps } = this.props
    const { annotatedDescription, description, to } = transaction
    const toApp = apps.find(app => addressesEqual(app.proxyAddress, to))
    const name = (toApp && toApp.name) || ''

    return { annotatedDescription, description, name, to, transaction }
  }

  signTransaction(transaction, intent, isPretransaction = false) {
    const {
      addTransactionActivity,
      walletWeb3,
      web3,
      setActivityConfirmed,
      setActivityFailed,
      setActivityNonce,
    } = this.props

    return new Promise((resolve, reject) => {
      walletWeb3.eth
        .sendTransaction(transaction)
        .on('transactionHash', transactionHash => {
          resolve(transactionHash)
          // Get account count/nonce for the transaction and update the activity item.
          // May be useful in case there are multiple pending transactions to detect when
          // a pending transaction with a lower nonce was manually re-sent by the user
          // (most likely done through their Ethereum provider directly with a different
          // gas price or transaction data that results in a different transaction hash).

          web3.eth
            .getTransaction(transactionHash)
            .then(({ nonce }) => setActivityNonce({ transactionHash, nonce }))
            .catch(console.error)

          // Pretransactions are for so the app can get approval
          const description = isPretransaction
            ? getPretransactionDescription(intent)
            : intent.description

          const hasForwarder = intent.to !== intent.transaction.to

          // Create new activiy
          addTransactionActivity({
            transactionHash,
            from: intent.transaction.from,
            targetApp: intent.name,
            targetAppProxyAddress: intent.to,
            forwarderProxyAddress: hasForwarder ? intent.transaction.to : '',
            description,
          })
        })
        .on('receipt', receipt => {
          if (receipt.status === RECIEPT_ERROR_STATUS) {
            // Faliure based on EIP 658
            setActivityFailed(receipt.transactionHash)
          } else {
            setActivityConfirmed(receipt.transactionHash)
          }
        })
        .on('error', err => {
          // Called when signing failed
          err && err.transactionHash && setActivityFailed(err.transactionHash)
          reject(err)
        })
    })
  }

  handleSign = async (transaction, intent, pretransaction) => {
    const { transactionBag } = this.props

    this.setState({ status: STATUS_TX_SIGNING })

    try {
      if (pretransaction) {
        await this.signTransaction(pretransaction, intent, true)
      }

      const transactionHash = await this.signTransaction(
        transaction,
        intent,
        false
      )

      transactionBag.resolve(transactionHash)
      this.setState({ signError: null, status: STATUS_TX_SIGNED })
      this.startClosing()
    } catch (err) {
      transactionBag.reject(err)
      // Display an error in the panel if the transaction failed
      this.setState({ signError: err, status: STATUS_TX_ERROR })
    }
  }

  handleMsgSign = async () => {
    const { account, signatureBag, walletWeb3 } = this.props

    this.setState({ status: STATUS_MSG_SIGNING })
    try {
      const signature = await walletWeb3.eth.personal.sign(
        signatureBag.message,
        account
      )

      signatureBag.resolve(signature)
      this.setState({ signError: null, status: STATUS_MSG_SIGNED })
      this.startClosing()
    } catch (err) {
      signatureBag.reject(err)
      this.setState({
        signError: err,
        status: STATUS_MSG_ERROR,
      })
    }
  }

  startClosing = () => {
    this._closeTimer = setTimeout(() => {
      if (isSignatureSuccess(this.state.status)) {
        this.handleSignerClose()
      }
    }, 3000)
  }

  handleSignerClose = () => {
    const { transactionBag, signatureBag } = this.props
    const { status } = this.state

    // Panel was closed manually by user to cancel the signing, so we need to
    // send feedback back to the apps
    if (status === STATUS_TX_CONFIRMING) {
      transactionBag.reject(new Error('User cancelled signing'))
    } else if (status === STATUS_MSG_CONFIRMING) {
      signatureBag.reject(new Error('User cancelled signing'))
    }

    this.setState({ panelOpened: false })
  }

  handleSignerTransitionEnd = opened => {
    // Reset signer state only after it has finished transitioning out
    if (!opened) {
      this.setState({ ...INITIAL_STATE })
    }
  }

  render() {
    const {
      account,
      dao,
      onRequestEnable,
      walletNetwork,
      walletProviderId,
      apps,
    } = this.props

    const {
      panelOpened,
      signError,
      intent,
      directPath,
      actionPaths,
      pretransaction,
      status,
    } = this.state

    const isTransaction = isTxSignerStatus(status)

    return (
      <SidePanel
        onClose={this.handleSignerClose}
        onTransitionEnd={this.handleSignerTransitionEnd}
        opened={panelOpened}
        title={isTransaction ? 'Create transaction' : 'Sign Message'}
      >
        <Main>
          <Transition
            items={isConfirmingSignature(status)}
            from={{ enterProgress: 1 }}
            enter={{ enterProgress: 0 }}
            initial={{ enterProgress: 0 }}
            leave={{ enterProgress: -1 }}
            config={springs.lazy}
            native
          >
            {confirming =>
              confirming
                ? ({ enterProgress }) => (
                    <ScreenWrapper
                      style={{
                        transform: enterProgress.interpolate(
                          v => `translate3d(${100 * v}%, 0, 0)`
                        ),
                      }}
                    >
                      <Screen>
                        <ValidateWalletWeb3
                          intent={intent}
                          isTransaction={isTransaction}
                          hasAccount={Boolean(account)}
                          hasWeb3={Boolean(getInjectedProvider())}
                          networkType={network.type}
                          onClose={this.handleSignerClose}
                          onRequestEnable={onRequestEnable}
                          walletNetworkType={walletNetwork}
                          walletProviderId={walletProviderId}
                        >
                          {isTransaction ? (
                            <ConfirmTransaction
                              dao={dao}
                              direct={directPath}
                              intent={intent}
                              onClose={this.handleSignerClose}
                              onSign={this.handleSign}
                              paths={actionPaths}
                              pretransaction={pretransaction}
                              signError={Boolean(signError)}
                              signingEnabled={status === STATUS_TX_CONFIRMING}
                              walletProviderId={walletProviderId}
                            />
                          ) : (
                            <ConfirmMsgSign
                              account={account}
                              apps={apps}
                              onClose={this.handleSignerClose}
                              intent={intent}
                              onSign={this.handleMsgSign}
                              signError={Boolean(signError)}
                              signingEnabled={status === STATUS_MSG_CONFIRMING}
                            />
                          )}
                        </ValidateWalletWeb3>
                      </Screen>
                    </ScreenWrapper>
                  )
                : ({ enterProgress }) => (
                    <ScreenWrapper
                      style={{
                        transform: enterProgress.interpolate(
                          v => `translate3d(${100 * v}%, 0, 0)`
                        ),
                      }}
                    >
                      <Screen>
                        <SigningStatus
                          status={status}
                          signError={signError}
                          onClose={this.handleSignerClose}
                          walletProviderId={walletProviderId}
                        />
                      </Screen>
                    </ScreenWrapper>
                  )
            }
          </Transition>
        </Main>
      </SidePanel>
    )
  }
}

const Main = styled.div`
  position: relative;
  margin: 0 -30px;
  overflow-x: hidden;
  min-height: 0;
  flex-grow: 1;
`

const ScreenWrapper = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 30px;
  display: flex;
  min-height: 100%;
`

const Screen = styled.div`
  width: 100%;
`

export default function(props) {
  const {
    addTransactionActivity,
    setActivityConfirmed,
    setActivityFailed,
    setActivityNonce,
  } = React.useContext(ActivityContext)
  return (
    <SignerPanel
      {...props}
      addTransactionActivity={addTransactionActivity}
      setActivityConfirmed={setActivityConfirmed}
      setActivityFailed={setActivityFailed}
      setActivityNonce={setActivityNonce}
    />
  )
}
