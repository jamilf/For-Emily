import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import useFocusTrap from '../hooks/useFocusTrap.js'
import useUiPrefs from '../hooks/useUiPrefs.js'
import { portalTarget } from '../utils/portalTarget.js'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { SOOT_AWAKE, PAL } from '../pixel/sprites.js'
import CommandButton from '../ui/jrpg/CommandButton.jsx'

/**
 * HarvestCeremony — one short completion moment that replaces the scattered
 * end-of-session handoff: the tree she grew sparkles, the companion celebrates,
 * her "one thing" is shown back with a kind line, and Continue hands off into the
 * existing reflection check-in. Under 8 seconds even untouched (it advances itself),
 * skippable by Esc and by the visible button, and under reduced motion or Minimal
 * effects it is a single still frame that simply waits for her.
 */
export default function HarvestCeremony({ plant, intention = '', companionName = null, onDone }) {
  const { instantMotion } = useUiPrefs()
  // Everything routes through one guarded finish so Esc + button + the auto-advance
  // can never double-fire the handoff.
  const doneRef = useRef(false)
  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  const trapRef = useFocusTrap(true, { onEscape: finish })

  useEffect(() => {
    if (instantMotion) return undefined // a still frame that waits for her
    const id = setTimeout(() => finishRef.current(), 6500)
    return () => clearTimeout(id)
  }, [instantMotion])

  const who = companionName || 'your soot friend'

  return createPortal(
    <div className="animate-fade-in modal-overlay-pad fixed inset-0 z-[60] flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-bgDim/70 sm:backdrop-blur-sm" />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="A little harvest"
        tabIndex={-1}
        className="animate-modal-in pixel-bevel relative z-10 w-full max-w-sm rounded-xl bg-cream p-6 text-center"
      >
        <div className="flex items-end justify-center gap-8">
          {plant && (
            <PixelSprite
              grid={plant.grid}
              palette={plant.palette}
              pixel={3}
              className={instantMotion ? '' : 'animate-pixel-pop'}
            />
          )}
          <PixelSprite
            grid={SOOT_AWAKE}
            palette={PAL}
            pixel={4}
            className={instantMotion ? '' : 'animate-soot-bob'}
          />
        </div>

        <p className="mt-4 font-display text-lg text-brownDark">
          Session done. One more tree for your grove.
        </p>
        {intention ? (
          <p className="mt-2 text-sm text-brown/80">
            You said you would begin with &ldquo;{intention}&rdquo;. And you did.
          </p>
        ) : (
          <p className="mt-2 text-sm text-brown/80">{who} watched the whole thing grow.</p>
        )}

        <div className="mt-5 flex justify-center">
          <CommandButton onClick={finish}>Continue</CommandButton>
        </div>
      </div>
    </div>,
    portalTarget(),
  )
}
