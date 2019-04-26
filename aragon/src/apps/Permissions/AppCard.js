import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Text, Card, Badge, theme, unselectable } from '@aragon/ui'
import { AppType } from '../../prop-types'
import { shortenAddress } from '../../web3-utils'
import AppIcon from '../../components/AppIcon/AppIcon'

class AppCard extends React.PureComponent {
  static propTypes = {
    app: AppType.isRequired,
    onOpen: PropTypes.func.isRequired,
  }

  handleClick = () => {
    this.props.onOpen(this.props.app.proxyAddress)
  }
  render() {
    const { app } = this.props
    const {
      name,
      identifier,
      isAragonOsInternalApp,
      hasWebApp,
      proxyAddress,
    } = app

    const instanceTitle = `Address: ${proxyAddress}`
    const instanceLabel = isAragonOsInternalApp
      ? 'System App'
      : !hasWebApp
      ? 'Background App'
      : identifier || shortenAddress(proxyAddress)

    return (
      <Main onClick={this.handleClick}>
        <div css="margin-bottom: 5px">
          <AppIcon app={app} size={28} />
        </div>
        <Name>
          <span>{name || 'Unknown'}</span>
        </Name>
        <IdentifierWrapper>
          <Identifier title={instanceTitle}>{instanceLabel}</Identifier>
        </IdentifierWrapper>
        <Action>
          <Text weight="bold" color={theme.textSecondary}>
            View
          </Text>
        </Action>
      </Main>
    )
  }
}

const Main = styled(Card).attrs({ width: '100%', height: '180px' })`
  ${unselectable};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 25px;
  cursor: pointer;
`

const Name = styled.p`
  display: flex;
  justify-content: center;
  max-width: calc(100% - 20px);
  margin: 0 10px 10px;
  span {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const IdentifierWrapper = styled.div`
  max-width: 100%;
  padding: 0 20px;
  margin-bottom: 10px;
`

const Identifier = styled(Badge.App)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`

const Action = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  padding-bottom: 30px;
  text-align: center;
`

export default AppCard
