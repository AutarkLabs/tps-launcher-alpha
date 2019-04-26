import React from 'react'
import PropTypes from 'prop-types'
import { Button, Table, TableRow, Text, Viewport } from '@aragon/ui'
import { TableHeader, TableCell, FirstTableCell, LastTableCell } from './Table'
import Section from './Section'
import EmptyBlock from './EmptyBlock'
import AppInstanceLabel from '../../components/AppInstanceLabel'
import { PermissionsConsumer } from '../../contexts/PermissionsContext'
import { EthereumAddressType } from '../../prop-types'

class EntityPermissions extends React.PureComponent {
  static propTypes = {
    address: EthereumAddressType.isRequired,
    loadPermissionsLabel: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    noPermissionsLabel: PropTypes.string,
    title: PropTypes.string.isRequired,
  }
  static defaultProps = {
    loadPermissionsLabel: 'Loading entity permissions…',
    noPermissionsLabel: 'No permissions set.',
  }
  render() {
    const {
      address,
      loading,
      loadPermissionsLabel,
      noPermissionsLabel,
      title,
    } = this.props

    return (
      <PermissionsConsumer>
        {({ revokePermission, getEntityRoles }) => {
          const roles = getEntityRoles(address)
          return (
            <Section title={title}>
              {loading || roles === null ? (
                <EmptyBlock>
                  {loading ? loadPermissionsLabel : noPermissionsLabel}
                </EmptyBlock>
              ) : (
                <Viewport>
                  {({ below }) => (
                    <Table
                      noSideBorders={below('medium')}
                      header={
                        <TableRow>
                          <TableHeader
                            title="Action"
                            style={{ width: '20%' }}
                          />
                          <TableHeader title="On app" />
                          <TableHeader />
                        </TableRow>
                      }
                    >
                      {roles.map(
                        ({ role, roleBytes, roleFrom, proxyAddress }, i) => (
                          <Row
                            key={i}
                            entityAddress={address}
                            id={(role && role.id) || 'Unknown'}
                            roleBytes={roleBytes}
                            action={(role && role.name) || 'Unknown'}
                            app={roleFrom.app}
                            proxyAddress={proxyAddress}
                            onRevoke={revokePermission}
                          />
                        )
                      )}
                    </Table>
                  )}
                </Viewport>
              )}
            </Section>
          )
        }}
      </PermissionsConsumer>
    )
  }
}

class Row extends React.Component {
  handleRevoke = () => {
    const { onRevoke, entityAddress, proxyAddress, roleBytes } = this.props
    onRevoke({ entityAddress, proxyAddress, roleBytes })
  }
  render() {
    const { action, app, proxyAddress } = this.props
    return (
      <TableRow>
        <FirstTableCell>
          <Text weight="bold">{action}</Text>
        </FirstTableCell>
        <TableCell>
          <AppInstanceLabel app={app} proxyAddress={proxyAddress} />
        </TableCell>
        <LastTableCell align="right">
          <Button
            mode="outline"
            emphasis="negative"
            compact
            onClick={this.handleRevoke}
          >
            Revoke
          </Button>
        </LastTableCell>
      </TableRow>
    )
  }
}

Row.propTypes = {
  action: PropTypes.string.isRequired,
  app: PropTypes.object.isRequired,
  entityAddress: EthereumAddressType.isRequired,
  onRevoke: PropTypes.func.isRequired,
  proxyAddress: EthereumAddressType.isRequired,
  roleBytes: PropTypes.string.isRequired,
}

export default EntityPermissions
