import React from 'react'
import PropTypes from 'prop-types'
import { DropDown, Field, TextInput } from '@aragon/ui'
import { getAnyEntity } from '../../permissions'
import { AppType } from '../../prop-types'
import { getEmptyAddress } from '../../web3-utils'
import AppInstanceLabel from '../../components/AppInstanceLabel'

class EntitySelector extends React.Component {
  static propTypes = {
    activeIndex: PropTypes.number.isRequired,
    apps: PropTypes.arrayOf(AppType).isRequired,
    includeAnyEntity: PropTypes.bool,
    label: PropTypes.string.isRequired,
    labelCustomAddress: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }
  state = {
    customAddress: '',
  }
  handleChange = index => {
    this.setState({ customAddress: '' }, () => {
      this.props.onChange({
        index,
        address: this.getAddress(index),
      })
    })
  }
  handleCustomAddressChange = event => {
    this.setState({ customAddress: event.target.value })
    this.props.onChange({
      index: this.getItems().length - 1,
      address: event.target.value,
    })
  }
  getApps() {
    const { apps } = this.props
    return apps.filter(app => Boolean(app.name))
  }
  getAppsItems() {
    return this.getApps().map(app => (
      <AppInstanceLabel app={app} proxyAddress={app.proxyAddress} />
    ))
  }
  getAddress(index) {
    if (index === 0) {
      return getEmptyAddress()
    }

    const items = this.getItems()

    if (index === items.length - 1) {
      return this.state.customAddress
    }

    if (this.props.includeAnyEntity && index === items.length - 2) {
      return getAnyEntity()
    }

    const app = this.getApps()[index - 1]
    return (app && app.proxyAddress) || getEmptyAddress()
  }
  getItems() {
    const { includeAnyEntity } = this.props

    const items = [
      'Select an entity',
      ...this.getAppsItems(),
      'Custom address…',
    ]
    if (includeAnyEntity) {
      // Add immediately before last item
      items.splice(-1, 0, 'Any account')
    }

    return items
  }
  render() {
    const { customAddress } = this.state
    const { activeIndex, label, labelCustomAddress } = this.props
    const items = this.getItems()
    const showCustomAddress = activeIndex === items.length - 1
    return (
      <React.Fragment>
        <Field label={label}>
          <DropDown
            items={items}
            active={activeIndex}
            onChange={this.handleChange}
            wide
          />
        </Field>

        {showCustomAddress && (
          <Field label={labelCustomAddress}>
            <TextInput
              placeholder="0xcafe…"
              value={customAddress}
              onChange={this.handleCustomAddressChange}
              wide
            />
          </Field>
        )}
      </React.Fragment>
    )
  }
}

export default EntitySelector
