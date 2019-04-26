import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, springs } from '@aragon/ui'
import { Transition, animated } from 'react-spring'
import { ReactSpringStateType } from '../../prop-types'
import RemoteImage from '../RemoteImage'

// Ratios based on the the design files
export const RATIO_LEFT = 500 / 1055
export const RATIO_TOP = 560 / 950

const TRANSLATE_VALUE_TITLE = 20
const TRANSLATE_VALUE_HEADING = 40
const TRANSLATE_VALUE_CONTENT = 60

// Helping the styled-components `css` preprocessor
// by using non-nested components.
const { div: AnimDiv, h1: AnimH1, p: AnimP } = animated

const HighlightScreen = ({
  compactMode,
  description,
  onUpgrade,
  enterProgress,
  showProgress,
  state,
  title,
  upgrade,
  verticalMode,
  visual,
}) => {
  const visualSrc = compactMode && visual.small ? visual.small : visual.large
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (state === 'leave') {
      setLeaving(true)
    }
  }, [state])
  return (
    <div
      css={`
        overflow: hidden;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        flex-shrink: 0;
        width: 100%;
        height: ${verticalMode ? 'auto' : '100%'};
        display: flex;
        flex-direction: ${verticalMode ? 'column-reverse' : 'row'};
        justify-content: ${verticalMode ? 'flex-end' : 'flex-start'};
        align-items: center;
        text-align: ${verticalMode ? 'center' : 'left'};
      `}
    >
      <AnimDiv
        css={`
          overflow: ${verticalMode ? 'visible' : 'hidden'};
          flex-shrink: 0;
          width: ${verticalMode ? 'auto' : `${RATIO_LEFT * 100}%`};
          height: ${verticalMode ? 'auto' : '100%'};
          padding: ${verticalMode ? '30px 20px 90px' : '10vh 60px 90px'};
          max-width: ${verticalMode ? '420px' : 'none'};
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        `}
        style={{
          opacity: showProgress.interpolate(v =>
            // Make content disappear faster than appearing
            leaving ? v * v : v
          ),
        }}
      >
        <AnimP
          css={`
            color: rgba(0, 0, 0, 0.5);
            text-transform: uppercase;
            font-size: ${compactMode ? 12 : 16}px;
          `}
          style={{
            transform: enterProgress.interpolate(
              v => `translate3d(${v * TRANSLATE_VALUE_TITLE}%, 0, 0)`
            ),
          }}
        >
          New Bella 0.7
        </AnimP>
        <AnimH1
          css={`
            font-size: ${compactMode ? 30 : 42}px;
            line-height: 1.6;
            margin: 10px 0 10px;
          `}
          style={{
            transform: enterProgress.interpolate(
              v => `translate3d(${v * TRANSLATE_VALUE_HEADING}%, 0, 0)`
            ),
          }}
        >
          {(compactMode && title.small) || title.large}
        </AnimH1>
        <AnimDiv
          style={{
            transform: enterProgress.interpolate(
              v => `translate3d(${v * TRANSLATE_VALUE_CONTENT}%, 0, 0)`
            ),
          }}
        >
          <p
            css={`
              line-height: 1.8;
              font-size: ${compactMode ? 16 : 18}px;
              color: ${compactMode ? '#8E97B5' : '#000000'};
            `}
          >
            {compactMode && description.small
              ? description.small
              : description.large}
          </p>
          {upgrade && (
            <div css="margin-top: 30px">
              <Button
                wide
                mode="strong"
                onClick={onUpgrade}
                css={`
                  height: 56px;
                  font-size: 18px;
                  font-weight: 600;
                `}
              >
                {compactMode && upgrade.small ? upgrade.small : upgrade.large}
              </Button>
            </div>
          )}
        </AnimDiv>
      </AnimDiv>
      <RemoteImage src={visualSrc}>
        {({ exists }) => (
          <AnimDiv
            css={`
              overflow: hidden;
              position: relative;
              z-index: 2;
              flex-shrink: 1;
              width: 100%;
              height: ${verticalMode ? `${RATIO_TOP * 100}%` : '100%'};
              background: ${visual.color};
            `}
            style={{ opacity: leaving ? 0 : 1 }}
          >
            <Transition
              native
              items={exists}
              from={{ opacity: 0 }}
              enter={{ opacity: 1 }}
              leave={{ opacity: 0 }}
              config={springs.lazy}
            >
              {exists =>
                exists &&
                /* eslint-disable react/prop-types */
                (({ opacity }) => (
                  <AnimDiv
                    css={`
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background: ${`
                        ${visual.color}
                        ${verticalMode ? '50% 40%' : '0 50%'} / cover
                        url(${visualSrc})
                        no-repeat;
                      `};
                    `}
                    style={{ opacity }}
                  />
                ))
              /* eslint-enable react/prop-types */
              }
            </Transition>
          </AnimDiv>
        )}
      </RemoteImage>
    </div>
  )
}

HighlightScreen.propTypes = {
  compactMode: PropTypes.bool,
  description: PropTypes.shape({
    small: PropTypes.string,
    large: PropTypes.string.isRequired,
  }),
  enterProgress: PropTypes.object,
  onUpgrade: PropTypes.func.isRequired,
  showProgress: PropTypes.object,
  state: ReactSpringStateType.isRequired,
  title: PropTypes.shape({
    small: PropTypes.string,
    large: PropTypes.string.isRequired,
  }),
  upgrade: PropTypes.shape({
    small: PropTypes.string,
    large: PropTypes.string.isRequired,
  }),
  verticalMode: PropTypes.bool,
  visual: PropTypes.shape({
    small: PropTypes.string,
    large: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
}

export default HighlightScreen
