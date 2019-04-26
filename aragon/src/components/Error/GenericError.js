import React from 'react'
import { SafeLink } from '@aragon/ui'
import ErrorCard from './ErrorCard'

const SUPPORT_URL = 'https://github.com/aragon/aragon/issues/new'

const GenericError = props => (
  <ErrorCard title="Oops." supportUrl={SUPPORT_URL} showReloadButton {...props}>
    Something went wrong and the application crashed. Reloading might solve the
    problem, or you can <SafeLink href={SUPPORT_URL}>create an issue</SafeLink>{' '}
    on GitHub so we can help.
  </ErrorCard>
)

export default GenericError
