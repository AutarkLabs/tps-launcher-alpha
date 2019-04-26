import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Button,
  ExternalLink,
  Info,
  SidePanel,
  SidePanelSeparator,
  SidePanelSplit,
  blockExplorerUrl,
} from '@aragon/ui'
import { ReposListType } from '../../prop-types'
import { TextLabel } from '../../components/TextStyles'
import AppIcon from '../../components/AppIcon/AppIcon'
import { network } from '../../environment'
import { KNOWN_ICONS } from '../../repo-utils'
import { getAppPath } from '../../routing'
import { repoBaseUrl } from '../../url-utils'
import { GU } from '../../utils'

const VERSION = '0.7 Bella'
const SOURCE = [
  'github.com/aragon/aragon-apps',
  'https://github.com/aragon/aragon-apps',
]
const REGISTRY = ['aragonpm.eth', 'https://etherscan.io/address/aragonpm.eth']

function getAppVersionData(repo) {
  const { content, version } = repo
  return {
    appId: content.appId,
    baseUrl: repoBaseUrl(repo),
    contractAddress: content.contractAddress,
    icons: content.icons,
    knownIcon: KNOWN_ICONS.has(content.appId)
      ? KNOWN_ICONS.get(content.appId)
      : null,
    name: content.name,
    version,
  }
}

const UpgradeOrganizationPanel = React.memo(
  ({ repos = [], opened, onClose, dao }) => {
    const [currentVersions, newVersions] = useMemo(
      () =>
        repos.reduce(
          (results, repo) => [
            [...results[0], getAppVersionData(repo.currentVersion)],
            [...results[1], getAppVersionData(repo.latestVersion)],
          ],
          [[], []]
        ),
      [repos]
    )

    return (
      <SidePanel
        title={`Upgrade to ${VERSION}`}
        opened={opened}
        onClose={onClose}
      >
        <SidePanelSplit>
          <div>
            <Heading2>Current version</Heading2>
            <div>
              {currentVersions.map(appVersion => (
                <AppVersion key={appVersion.appId} {...appVersion} />
              ))}
            </div>
          </div>
          <div>
            <Heading2>New version</Heading2>
            {newVersions.map(appVersion => (
              <AppVersion key={appVersion.appId} {...appVersion} />
            ))}
          </div>
        </SidePanelSplit>

        <Part>
          <Heading2>Source code</Heading2>
          <p>
            <ExternalLink href={SOURCE[1]}>{SOURCE[0]}</ExternalLink>
          </p>

          <Heading2>Aragon official registry</Heading2>
          <p>
            <ExternalLink href={REGISTRY[1]}>{REGISTRY[0]}</ExternalLink>
          </p>
        </Part>

        <SidePanelSeparator />

        <Part>
          <div
            css={`
              margin: ${2 * GU}px 0;
            `}
          >
            <Info.Action title="Action to be triggered">
              <p
                css={`
                  margin-top: ${GU}px;
                  font-size: 15px;
                `}
              >
                All your app instances will be upgraded to Aragon {VERSION}.
              </p>
            </Info.Action>
          </div>
          <div
            css={`
              margin: ${2 * GU}px 0;
            `}
          >
            <Button.Anchor
              mode="strong"
              wide
              style={{ textAlign: 'center' }}
              href={`#${getAppPath({
                dao,
                instanceId: 'apps',
                params: `installed`,
              })}`}
              onClick={onClose}
            >
              Check updates
            </Button.Anchor>
          </div>
        </Part>
      </SidePanel>
    )
  }
)

UpgradeOrganizationPanel.propTypes = {
  opened: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  repos: ReposListType,
  dao: PropTypes.string.isRequired,
}

const AppVersion = ({
  baseUrl,
  contractAddress,
  icons,
  knownIcon,
  name,
  version,
}) => {
  const major = version.split('.')[0]
  return (
    <div
      css={`
        display: flex;
        align-items: center;
        margin: 10px 0;
      `}
    >
      <div
        css={`
          width: 20px;
          margin-right: 5px;
        `}
      >
        v{major || version}
      </div>
      <ExternalLink
        href={blockExplorerUrl('address', contractAddress, {
          networkType: network.type,
        })}
        css={`
          display: flex;
          background: #daeaef;
          border-radius: 3px;
          align-items: center;
          height: 22px;
          align-items: center;
          text-decoration: none;
        `}
      >
        <AppIcon
          app={{ baseUrl, icons }}
          src={knownIcon || undefined}
          radius={3}
        />
        <div
          css={`
            padding: 0 5px;
          `}
        >
          {name}
        </div>
      </ExternalLink>
    </div>
  )
}

AppVersion.propTypes = {
  baseUrl: PropTypes.string.isRequired,
  contractAddress: PropTypes.string.isRequired,
  icons: PropTypes.array.isRequired,
  knownIcon: PropTypes.string,
  name: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,
}

const Heading2 = styled(TextLabel).attrs({ as: 'h2' })`
  white-space: nowrap;
`

const Part = styled.div`
  padding: ${GU}px 0 ${3 * GU}px;
  ${Heading2} {
    margin: ${2 * GU}px 0 ${GU}px;
  }
`

export default UpgradeOrganizationPanel
