import { detectProvider } from '@aragon/wrapper'
import apm from '@aragon/apm'
import Web3 from 'web3'

// Templates
import Templates from './templates'

/**
 * Set up an instance of the template factory that can be used independently
 *
 * @param {string} from
 *        The address of the account using the factory.
 * @param {Object} options
 *        Template factory options.
 * @param {Object} [options.apm]
 *        Options for apm.js (see https://github.com/aragon/apm.js)
 * @param {string} [options.apm.ensRegistryAddress]
 *        ENS registry for apm.js
 * @param {Object} [options.apm.ipfs]
 *        IPFS provider config for apm.js
 * @param {string} [options.apm.ipfs.gateway]
 *        IPFS gateway apm.js will use to fetch artifacts from
 * @param {Function} [options.defaultGasPriceFn=function]
 *        A factory function to provide the default gas price for transactions.
 *        It can return a promise of number string or a number string. The function
 *        has access to a recommended gas limit which can be used for custom
 *        calculations. This function can also be used to get a good gas price
 *        estimation from a 3rd party resource.
 * @param {string|Object} [options.provider=web3.currentProvider]
 *        The Web3 provider to use for blockchain communication. Defaults to `web3.currentProvider`
 *        if web3 is injected, otherwise will fallback to wss://rinkeby.eth.aragon.network/ws
 * @return {Object} Template factory instance
 */
export const setupTemplates = (from, options = {}) => {
  const defaultOptions = {
    apm: {},
    defaultGasPriceFn: () => {},
    provider: detectProvider(),
  }
  options = Object.assign(defaultOptions, options)
  const web3 = new Web3(options.provider)

  return Templates(from, {
    web3,
    apm: apm(web3, options.apm),
    defaultGasPriceFn: options.defaultGasPriceFn,
  })
}

// TODO: custom ens other than aragonid at wrapper/templates/index.js
