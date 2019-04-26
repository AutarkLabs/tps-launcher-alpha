import React from 'react'
import PropTypes from 'prop-types'
import { Subject } from 'rxjs'

const identityEventTypes = {
  CLEAR: 'CLEAR',
  IMPORT: 'IMPORT',
  MODIFY: 'MODIFY',
}

// An events subject
// { type: '<string>', address: <string> }
const identityEvents$ = new Subject()

const IdentityContext = React.createContext({
  resolve: () =>
    Promise.reject(Error('Please set resolve using IdentityProvider')),
})

const IdentityProvider = ({ onResolve, children }) => {
  return (
    <IdentityContext.Provider value={{ resolve: onResolve, identityEvents$ }}>
      {children}
    </IdentityContext.Provider>
  )
}

IdentityProvider.propTypes = {
  onResolve: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

const IdentityConsumer = IdentityContext.Consumer

export {
  IdentityProvider,
  IdentityConsumer,
  IdentityContext,
  identityEventTypes,
}
