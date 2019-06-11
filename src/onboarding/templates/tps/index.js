import BN from 'bn.js'
import ConfigureVotingDefaults from './ConfigureVotingDefaults'
import ConfigureTokenName from './ConfigureTokenName'
import icon from './assets/icon.svg'

const isIntegerString = value => /^\d*$/.test(value)
const isFloatString = value => /^\d*\.?\d*$/.test(value)

const template = {
  name: 'tps',
  label: 'That Planning Suite DAO',
  icon,
  fields: {
    support: {
      defaultValue: () => '',
      filter: (value, { dotMinQuorum, minQuorum }) => {
        if (!isFloatString(value)) {
          return { support: '' }
        }
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return { support: '' }
        }

        const support = Math.min(99.99, Math.max(1, numValue))
        return {
          support: support !== numValue ? support.toString() : value,
          minQuorum: (support < minQuorum ? support : minQuorum).toString(),
          dotMinQuorum: (support < dotMinQuorum
            ? support
            : dotMinQuorum
          ).toString(),
        }
      },
    },
    dotMinQuorum: {
      defaultValue: () => '',
      filter: (value, { minQuorum, support }) => {
        if (!isFloatString(value)) {
          return { minQuorum: '' }
        }
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return { minQuorum: '' }
        }

        const dotMinQuorum = Math.min(99.99, Math.max(0, numValue))

        return {
          dotMinQuorum:
            dotMinQuorum !== numValue ? dotMinQuorum.toString() : value,
          minQuorum: minQuorum !== numValue ? minQuorum.toString() : value,
          support: (support < dotMinQuorum ? dotMinQuorum : support).toString(),
        }
      },
    },
    minQuorum: {
      defaultValue: () => '',
      filter: (value, { dotMinQuorum, support }) => {
        if (!isFloatString(value)) {
          return { minQuorum: '' }
        }
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          return { minQuorum: '' }
        }

        const minQuorum = Math.min(99.99, Math.max(0, numValue))
        return {
          dotMinQuorum:
            dotMinQuorum !== numValue ? dotMinQuorum.toString() : value,
          minQuorum: minQuorum !== numValue ? minQuorum.toString() : value,
          support: (support < minQuorum ? minQuorum : support).toString(),
        }
      },
    },
    voteDuration: {
      defaultValue: () => '',
      filter: value => {
        if (!isIntegerString(value) || value === '') {
          return { voteDuration: '' }
        }
        const voteDuration = parseInt(value, 10)
        if (isNaN(voteDuration)) {
          return ''
        }
        if (voteDuration > Number.MAX_SAFE_INTEGER) {
          return ''
        }
        return {
          voteDuration: Math.max(1, value).toString(),
        }
      },
    },
    tokenName: {
      defaultValue: () => '',
      filter: value => ({ tokenName: value.slice(0, 30) }),
    },
    tokenSymbol: {
      defaultValue: () => '',
      filter: value => ({ tokenSymbol: value.toUpperCase().slice(0, 5) }),
    },
  },
  screens: [
    {
      screen: 'voting-defaults',
      validate: ({ support, dotMinQuorum, minQuorum, voteDuration }) => {
        // Mimic contract validation
        if (
          dotMinQuorum < 0 ||
          dotMinQuorum > support ||
          minQuorum < 0 ||
          minQuorum > support
        ) {
          return false
        }
        if (support < 1 || support >= 100) {
          return false
        }
        if (voteDuration < 1) {
          return false
        }
        return true
      },
      Component: ConfigureVotingDefaults,
    },
    {
      screen: 'token-name',
      validate: ({ tokenName, tokenSymbol }) => {
        return tokenName.length > 0 && tokenSymbol.length > 0
      },
      Component: ConfigureTokenName,
    },
  ],
  prepareData: ({
    tokenName,
    tokenSymbol,
    support,
    dotMinQuorum,
    minQuorum,
    voteDuration,
  }) => {
    const percentageBase = new BN(10).pow(new BN(16))
    return {
      dotMinAcceptanceQuorum: percentageBase.muln(parseFloat(dotMinQuorum)),
      tokenName: tokenName.trim(),
      tokenSymbol: tokenSymbol.trim(),
      votingSupportNeeded: percentageBase.muln(parseFloat(support)),
      votingMinAcceptanceQuorum: percentageBase.muln(parseFloat(minQuorum)),
      voteDuration: voteDuration * 60 * 60,
    }
  },
}

export default template
