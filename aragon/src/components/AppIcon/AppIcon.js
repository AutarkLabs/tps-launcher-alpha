import React from 'react'
import PropTypes from 'prop-types'
import { appIconUrl, legacyAppIconUrl } from '../../utils'
import RemoteImage from '../RemoteImage'

import iconSvgAcl from './assets/app-acl.svg'
import iconSvgDefault from './assets/app-default.svg'
import iconSvgHome from './assets/app-home.svg'
import iconSvgKernel from './assets/app-kernel.svg'
import iconSvgRegistry from './assets/app-registry.svg'

const DEFAULT_SIZE = 22
const DEFAULT_RADIUS = 5

const KNOWN_ICONS = new Map([
  ['home', iconSvgHome],
  [
    '0x3b4bf6bf3ad5000ecf0f989d5befde585c6860fea3e574a4fab4c49d1c177d9c',
    iconSvgKernel,
  ],
  [
    '0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a',
    iconSvgAcl,
  ],
  [
    '0xddbcfd564f642ab5627cf68b9b7d374fb4f8a36e941a75d89c87998cef03bd61',
    iconSvgRegistry,
  ],
])

const AppIcon = ({ app, src, size, radius, ...props }) => {
  if (radius === -1) {
    radius = size * (DEFAULT_RADIUS / DEFAULT_SIZE)
  }
  return (
    <div
      css={`
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: ${radius}px;
      `}
      {...props}
    >
      <AppIconContent app={app} size={size} src={src} />
    </div>
  )
}

AppIcon.propTypes = {
  app: PropTypes.object,
  src: PropTypes.string,
  radius: PropTypes.number,
  size: PropTypes.number.isRequired,
}

AppIcon.defaultProps = {
  app: null,
  src: null,
  radius: -1,
  size: DEFAULT_SIZE,
}

// Disabling the ESLint prop-types check for internal components.
/* eslint-disable react/prop-types */

const AppIconContent = ({ app, size, src }) => {
  if (src) {
    return <RemoteIcon src={src} size={size} />
  }

  if (app && KNOWN_ICONS.has(app.appId)) {
    return <IconBase size={size} src={KNOWN_ICONS.get(app.appId)} />
  }

  return (
    <RemoteIcon src={appIconUrl(app, size)} size={size}>
      <RemoteIcon src={legacyAppIconUrl(app)} size={size} />
    </RemoteIcon>
  )
}

// Display a remote icon if found,
// otherwise a provided fallback if provided,
// otherwise the default icon.
const RemoteIcon = ({ src, size, children }) => {
  const fallback = children || <IconBase size={size} src={iconSvgDefault} />
  return src === null ? (
    fallback
  ) : (
    <RemoteImage src={src}>
      {({ exists }) => (exists ? <IconBase size={size} src={src} /> : fallback)}
    </RemoteImage>
  )
}

// Base icon
const IconBase = ({ src, size, alt = '', ...props }) => (
  <img {...props} src={src} width={size} height={size} alt={alt} />
)

export default AppIcon
