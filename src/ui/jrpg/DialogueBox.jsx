import { useId } from 'react'
import PixelSprite from '../../pixel/PixelSprite.jsx'
import { SOOT_AWAKE, PAL } from '../../pixel/sprites.js'
import useUiPrefs from '../../hooks/useUiPrefs.js'
import useTypewriter from '../../hooks/useTypewriter.js'

/**
 * DialogueBox — the JRPG message window: a companion portrait, a wood nameplate,
 * and a skippable typewriter reveal with a "continue" indicator. Used for sprite
 * lines, encouragements, story beats, and onboarding.
 *
 * Usability guarantees (enforced):
 *  - The COMPLETE text is always in the DOM in an sr-only live region, so screen
 *    readers get the whole line immediately and progress is never gated on waiting.
 *  - A tap/click/Enter/Space completes the reveal instantly; tapping again advances.
 *  - Instant (no crawl) under reduced motion, Minimal effects, or typewriter-off.
 *
 * Presentational + non-modal by default (it is usually an aria-live toast); callers
 * own placement and any action buttons (passed as children).
 */
export default function DialogueBox({
  name = null,
  text = '',
  portraitGrid = SOOT_AWAKE,
  portraitPalette = PAL,
  onAdvance,
  advanceLabel = 'continue',
  live = true,
  className = '',
  children,
}) {
  const { typewriter, instantMotion } = useUiPrefs()
  const { shown, done, skip } = useTypewriter(text, {
    cps: 55,
    enabled: typewriter,
    instant: instantMotion,
  })
  const labelId = useId()

  // One tap does the obvious thing: finish the crawl, or advance once finished.
  function handleActivate() {
    if (!done) {
      skip()
      return
    }
    onAdvance?.()
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      handleActivate()
    }
  }

  const interactive = !done || typeof onAdvance === 'function'

  return (
    <div
      className={`pixel-bevel relative overflow-hidden rounded-xl bg-jrpg-window text-jrpg-text ${className}`}
    >
      {name && (
        <div className="jrpg-nameplate inline-flex items-center gap-1 rounded-br-lg bg-jrpg-nameplate px-2.5 py-1">
          <span aria-hidden="true" className="h-2 w-2 rotate-45 bg-jrpg-cursor" />
          <span className="font-display text-xs tracking-wide text-cream">{name}</span>
        </div>
      )}

      <div className="flex items-start gap-3 p-3.5">
        <PixelSprite grid={portraitGrid} palette={portraitPalette} pixel={3} className="shrink-0" />

        <div className="min-w-0 flex-1">
          {/* The reveal the eye follows. It is aria-hidden (SR reads the full copy
              below); when there is an action, it lives inside a real, labeled button
              so keyboard + tap reach it without an aria-hidden control. */}
          {(() => {
            const inner = (
              <span aria-hidden="true">
                {shown}
                {!done && <span className="jrpg-caret ml-0.5 inline-block">▍</span>}
                {done && onAdvance && (
                  <span className="jrpg-advance ml-1.5 inline-block text-jrpg-cursor">▼</span>
                )}
              </span>
            )
            return interactive ? (
              <button
                type="button"
                onClick={handleActivate}
                onKeyDown={onKeyDown}
                aria-label={done ? advanceLabel : 'Reveal the full line'}
                aria-describedby={labelId}
                className="block w-full text-left text-sm leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                {inner}
              </button>
            ) : (
              <p className="text-sm leading-snug" aria-hidden="true">
                {inner}
              </p>
            )
          })()}
          {/* The full line, present immediately for assistive tech. `live` is
              turned off when an ancestor already owns the live region (e.g. a
              greeting toast), to avoid a double announcement. */}
          <p id={labelId} className="sr-only" aria-live={live ? 'polite' : undefined}>
            {text}
            {done && onAdvance ? `. Press ${advanceLabel} to continue.` : ''}
          </p>

          {children && <div className="mt-2.5">{children}</div>}
        </div>
      </div>
    </div>
  )
}
