/* eslint react/prop-types: 0 */
import React from 'react'
import styled from 'styled-components'
import { Field, TextInput, Text, theme, SafeLink } from '@aragon/ui'
import { animated } from 'react-spring'
import { noop } from '../../../utils'

const TPS_GUIDE =
  'https://github.com/AutarkLabs/planning-suite/blob/dev/docs/GETTING_STARTED.md#configure-voting-settings'

class ConfigureVotingDefaults extends React.Component {
  static defaultProps = {
    onFieldUpdate: noop,
    onSubmit: noop,
    fields: {},
  }
  constructor(props) {
    super(props)
    this.handleSupportChange = this.createChangeHandler('support')
    this.handleMinQuorumChange = this.createChangeHandler('minQuorum')
    this.handleDotMinQuorumChange = this.createChangeHandler('dotMinQuorum')
    this.handleVoteDurationChange = this.createChangeHandler('voteDuration')
  }
  componentWillReceiveProps({ forceFocus }) {
    if (forceFocus && forceFocus !== this.props.forceFocus) {
      this.formEl.elements[0].focus()
    }
  }
  createChangeHandler(name) {
    return event => {
      const { onFieldUpdate, screen } = this.props
      onFieldUpdate(screen, name, event.target.value)
    }
  }
  handleSubmit = event => {
    event.preventDefault()
    this.props.onSubmit()
  }
  handleFormRef = el => {
    this.formEl = el
  }
  render() {
    const { fields, screenTransitionStyles } = this.props
    return (
      <Main style={screenTransitionStyles}>
        <ConfigureVotingDefaultsContent
          fields={fields}
          handleSupportChange={this.handleSupportChange}
          handleMinQuorumChange={this.handleMinQuorumChange}
          handleDotMinQuorumChange={this.handleDotMinQuorumChange}
          handleVoteDurationChange={this.handleVoteDurationChange}
          onSubmit={this.handleSubmit}
          formRef={this.handleFormRef}
        />
      </Main>
    )
  }
}

class ConfigureVotingDefaultsContent extends React.PureComponent {
  render() {
    const {
      fields,
      handleSupportChange,
      handleDotMinQuorumChange,
      handleMinQuorumChange,
      handleVoteDurationChange,
      onSubmit,
      formRef,
    } = this.props
    const adornmentSettings = { padding: 7 }
    return (
      <Content>
        <Title>Configure voting settings</Title>
        <StepContainer>
          <SubmitForm onSubmit={onSubmit} ref={formRef}>
            <TextContainer>
              <Text size="large" color={theme.textSecondary} align="center">
                Choose your settings for the Voting and Dot Voting apps below. You can’t change the support
                required later, so pick carefully.
              </Text>
            </TextContainer>
            <Fields>
              <InlineField label="Voting (Support)">
                <SymbolInput
                  adornment="%"
                  adornmentPosition="end"
                  adornmentSettings={adornmentSettings}
                  placeholder="e.g. 50"
                  value={fields.support === -1 ? '' : fields.support}
                  onChange={handleSupportChange}
                />
              </InlineField>
              <InlineField label="Voting (Min. Quorum)">
                <SymbolInput
                  adornment="%"
                  adornmentPosition="end"
                  adornmentSettings={adornmentSettings}
                  placeholder="e.g. 15"
                  value={fields.minQuorum === -1 ? '' : fields.minQuorum}
                  onChange={handleMinQuorumChange}
                />
              </InlineField>
              <InlineField label="Dot Voting (Quorum)">
                <SymbolInput
                  adornment="%"
                  adornmentPosition="end"
                  adornmentSettings={adornmentSettings}
                  placeholder="e.g. 15"
                  value={fields.dotMinQuorum === -1 ? '' : fields.dotMinQuorum}
                  onChange={handleDotMinQuorumChange}
                />
              </InlineField>
              <InlineField label="Vote Duration">
                <SymbolInput
                  adornment="H"
                  adornmentPosition="end"
                  adornmentSettings={adornmentSettings}
                  placeholder="e.g. 24"
                  onChange={handleVoteDurationChange}
                  value={fields.voteDuration === -1 ? '' : fields.voteDuration}
                />
              </InlineField>
            </Fields>
            <TextContainer>
              <Text size="xsmall" color={theme.textSecondary} align="left">
                The support and quorum thresholds are <em>strict</em>{' '}
                requirements, such that votes will only pass if they achieve
                percentages <em>greater than</em> these thresholds.{' '}
                  <StrongSafeLink
                    href={TPS_GUIDE}
                    target="_blank"
                  >
                    Find out more
                  </StrongSafeLink>{' '}
                  about these thresholds.
              </Text>
            </TextContainer>
          </SubmitForm>
        </StepContainer>
      </Content>
    )
  }
}

const SubmitForm = React.forwardRef(({ children, ...props }, ref) => (
  <form {...props} ref={ref}>
    {children}
    <input type="submit" style={{ display: 'none' }} />
  </form>
))

const Main = styled(animated.div)`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 100px;
  padding-top: 140px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Title = styled.h1`
  text-align: center;
  font-size: 37px;
  margin-bottom: 100px;
`

const TextContainer = styled.p`
  text-align: center;
  max-width: 700px;
`

const StrongSafeLink = styled(SafeLink)`
  text-decoration-color: ${theme.accent};
  color: ${theme.accent};
`

const StepContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const SymbolInput = styled(TextInput)`
  text-align: right;
  width: 120px;
  padding-right: 25px;
`

const Fields = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`
const InlineField = styled(Field)`
  & + & {
    margin-left: 55px;
  }
`

export default ConfigureVotingDefaults
