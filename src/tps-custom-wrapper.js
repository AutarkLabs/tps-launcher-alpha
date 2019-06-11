import { detectProvider } from '@aragon/wrapper'
import apm from '@aragon/apm'
import Web3 from 'web3'

const DEFAULT_GAS_FUZZ_FACTOR = 1.5
const PREVIOUS_BLOCK_GAS_LIMIT_FACTOR = 0.95

async function getRecommendedGasLimit(
    web3,
    estimatedGasLimit,
    { gasFuzzFactor = DEFAULT_GAS_FUZZ_FACTOR } = {}
) {
    const latestBlock = await web3.eth.getBlock('latest')
    const latestBlockGasLimit = latestBlock.gasLimit

    const upperGasLimit = Math.round(
        latestBlockGasLimit * PREVIOUS_BLOCK_GAS_LIMIT_FACTOR
    )
    const bufferedGasLimit = Math.round(estimatedGasLimit * gasFuzzFactor)

    if (estimatedGasLimit > upperGasLimit) {
        // TODO: Consider whether we should throw an error rather than returning with a high gas limit
        return estimatedGasLimit
    } else if (bufferedGasLimit < upperGasLimit) {
        return bufferedGasLimit
    } else {
        return upperGasLimit
    }
}

// Maybe we can even do a simple markup language that aragon/aragon interprets
const templates = {
    democracy: {
        name: 'Democracy',
        appId: 'democracy-kit.aragonpm.eth',
    },
    multisig: {
        name: 'Multisig',
        appId: 'multisig-kit.aragonpm.eth',
    },
    tps: {
        name: 'That Planning Suite',

        // TODO: Enable for rinkeby:
        // appId: 'tps.open.aragonpm.eth',
        appId: 'planning-suite-staging.open.aragonpm.eth',
    },
}

/**
* @name Templates
* @function
* @description Factory for DAO templates.
*
* @param {string} from
*        The address of the account using the factory.
* @param {Object} options
*        Template factory options.
* @param {Object} options.apm
*        apm.js instance
* @param {Function} options.defaultGasPriceFn
*        A factory function to provide the default gas price for transactions.
*        It can return a promise of number string or a number string. The function
*        has access to a recommended gas limit which can be used for custom
*        calculations. This function can also be used to get a good gas price
*        estimation from a 3rd party resource.
* @param {Object} options.web3
*        Web3 instance
* @return {Object} Factory object
*/
const Templates = (from, { apm, defaultGasPriceFn, web3 }) => {
    const newToken = async (template, { params, options = {} }) => {
        const [tokenName, tokenSymbol] = params
        const call = template.methods.newToken(tokenName, tokenSymbol)
        const receipt = await call.send({
            from,
            ...(await applyCallGasOptions(call, options)),
        })
        return receipt.events.DeployToken.returnValues
    }

    const newInstance = async (template, { params, options = {} }) => {
        const call = template.methods.newInstance(...params)
        const receipt = await call.send({
            from,
            ...(await applyCallGasOptions(call, options)),
        })
        return receipt.events.DeployInstance.returnValues
    }

    const applyCallGasOptions = async (call, txOptions = {}) => {
        if (!txOptions.gas) {
            const estimatedGasLimit = await call.estimateGas({ from })
            const recommendedGasLimit = await getRecommendedGasLimit(
                web3,
                estimatedGasLimit,
                { gasFuzzFactor: 1.1 }
            )
            txOptions.gas = recommendedGasLimit
        }

        if (!txOptions.gasPrice) {
            txOptions.gasPrice = await defaultGasPriceFn(txOptions.gas)
        }

        return txOptions
    }

    return {
        /**
         * Create a new DAO by sending two transactions:
         *
         *   1. Create a new token
         *   2. Create a new instance of a template (the token is cached in the template contract)
         *
         * @param {string} templateName name of the template to use
         * @param {Object} tokenParams parameters for the token creation transaction
         * @param {Array<string>} tokenParams.params array of [<Token name>, <Token symbol>]
         * @param {Object} [tokenParams.options={}] transaction options
         * @param {Object} instanceParams parameters for the DAO creation transaction
         * @param {Array<string>} tokenParams.params parameters for the template's `newDAO()` method
         * @param {Object} [instanceParams.options={}] transaction options
         * @return {Array<Object>} return values for `DeployEvent` and `DeployInstance`
         */
        newDAO: async (templateName, tokenParams, instanceParams) => {
            const tmplObj = templates[templateName]

            if (!tmplObj) throw new Error('No template found for that name')

            const { contractAddress, abi } = await apm.getLatestVersion(tmplObj.appId)

            if (!contractAddress) {
                throw new Error(
                    `No contract found on APM for template '${templateName}'`
                )
            }
            if (!abi) {
                throw new Error(`Could not fetch ABI for template '${templateName}'`)
            }

            const template = new web3.eth.Contract(abi, contractAddress)

            const token = await newToken(template, tokenParams)
            const instance = await newInstance(template, instanceParams)

            return [token, instance]
        },
    }
}

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
        defaultGasPriceFn: () => { },
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