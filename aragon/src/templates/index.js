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

    appId: 'tps.open.aragonpm.eth',
    // TODO: manage both enviroments? staging and rinkeby
    // appId: 'planning-suite-staging.open.aragonpm.eth',
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
  // const newToken = async (template, { params, options = {} }) => {
  //   const [tokenName, tokenSymbol] = params
  //   const call = template.methods.newToken(tokenName, tokenSymbol)
  //   const receipt = await call.send({
  //     from,
  //     ...(await applyCallGasOptions(call, options)),
  //   })
  //   return receipt.events.DeployToken.returnValues
  // }

  // const newInstance = async (template, { params, options = {} }) => {
  //   const call = template.methods.newInstance(...params)
  //   const receipt = await call.send({
  //     from,
  //     ...(await applyCallGasOptions(call, options)),
  //   })
  //   return receipt.events.DeployInstance.returnValues
  // }
  const newTokenAndInstance = async (template, { params, options = {} }) => {
    const call = template.methods.newTokenAndInstance(...params)
    const receipt = await call.send({
      from,
      ...(await applyCallGasOptions(call, options)),
    })
    return [
      receipt.events.DeployInstance.returnValues,
      receipt.events.DeployToken.returnValues,
    ]
  }

  const newPlanningApps = async (template, { params, options = {} }) => {
    const call = template.methods.newPlanningApps(...params)
    const receipt = await call.send({
      from,
      ...(await applyCallGasOptions(call, options)),
    })
    // return receipt.events.DeployPlanningApps.returnValues
    return receipt
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
     * @param {Object} tokenAndInstanceParams parameters for the token creation transaction
     * @param {Array<string>} tokenParams.params array of [<Token name>, <Token symbol>]
     * @param {Object} [tokenParams.options={}] transaction options
     * @param {Object} planningAppsParams parameters for the DAO creation transaction
     * @param {Array<string>} tokenParams.params parameters for the template's `newDAO()` method
     * @param {Object} [instanceParams.options={}] transaction options
     * @return {Array<Object>} return values for `DeployEvent` and `DeployInstance`
     */
    newDAO: async (
      templateName,
      tokenAndInstanceParams,
      planningAppsParams
    ) => {
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

      /**
       * function newToken(string tokenName, string tokenSymbol) public returns (MiniMeToken token)
       */
      // const token = await newToken(template, tokenParams)
      /**
       * function newInstance(
       *    string aragonId,
       *    address[] holders,
       *    uint256[] stakes,
       *    uint64 supportNeeded,
       *    uint64 minAcceptanceQuorum,
       *    uint64 voteDuration
       * )
       * public returns (Kernel dao, Vault vault, Voting voting)
       */
      // const instance = await newInstance(template, instanceParams)

      //   function newTokenAndInstance(
      //     string tokenName,
      //     string tokenSymbol,
      //     string aragonId,
      //     address[] holders,
      //     uint256[] tokens,
      //     uint64 supportNeeded,
      //     uint64 minAcceptanceQuorum,
      //     uint64 voteDuration
      // ) public
      const [instance, token] = await newTokenAndInstance(
        template,
        tokenAndInstanceParams
      )
      // function newPlanningApps(
      //   Kernel dao,
      //   Vault vault,
      //   Voting voting,
      //   MiniMeToken token,
      //   uint256 candidateSupportPct,
      //   uint256 minParticipationPct,
      //   uint64 voteDuration) public

      const { dao, vault, voting, tokenAddr } = instance
      const finalParams = {
        params: [dao, vault, voting, tokenAddr, ...planningAppsParams.params],
      }
      console.log('Planning App final Params:', finalParams)

      const tps = await newPlanningApps(template, finalParams)
      console.log('TPS Created', tps)

      return [instance, token]
    },
  }
}

export default Templates
