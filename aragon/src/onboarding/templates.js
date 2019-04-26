import PropTypes from 'prop-types'

import democracy from './templates/democracy'
import multisig from './templates/multisig'
import tps from './templates/tps'

const Multisig = Symbol('Multisig')
const Democracy = Symbol('Democracy')
const ThatPlanningSuite = Symbol('ThatPlanningSuite')

const Templates = new Map()
Templates.set(Democracy, democracy)
Templates.set(Multisig, multisig)
Templates.set(ThatPlanningSuite, tps)

const TemplateType = PropTypes.oneOf([Multisig, Democracy, ThatPlanningSuite])

export default Templates
export { TemplateType, Multisig, Democracy, ThatPlanningSuite }
