import { useRef } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import usePersistedState from '../hooks/useLocalStorage.js'
import { SEASONS, seasonProgress } from '../data/seasons.js'

/**
 * Sanctuary Seasons — a small, read-only field guide to how the world grows. Derived
 * from the harvested-tree count; nothing is persisted. Lists all four seasons with the
 * current one marked in text (✦ Now) and a gentle progress line. A lazy, focus-trapped
 * modal matching the app's overlay chrome. State is conveyed by name + text, never colour.
 */
export default function SeasonsModal({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const total = garden.length
  const { season, next, remaining } = seasonProgress(total)

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const progressLine = next
    ? `${season.name}, ${remaining} more ${remaining === 1 ? 'tree' : 'trees'} until ${next.name}.`
    : `${season.name}, the deepest season. Your sanctuary is in full bloom of rest.`

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center modal-overlay-pad">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/75 sm:backdrop-blur-sm"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sanctuary Seasons"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            {season.emoji} Sanctuary Seasons
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close seasons"
            className="grid h-10 w-10 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-4 overflow-y-auto bg-cream p-5 text-brownDark">
          <p className="text-sm text-brown/75">
            Your world changes with your grove, not the calendar. Every tree you grow nudges the seasons
            along.
          </p>

          <p className="font-display text-sm text-brown" aria-live="polite">
            {progressLine}
          </p>

          <ul className="space-y-2">
            {SEASONS.map((s) => {
              const isNow = s.id === season.id
              return (
                <li
                  key={s.id}
                  className={`rounded-2xl border-2 p-3 ${
                    isNow ? 'border-brown/40 bg-white/80' : 'border-brown/15 bg-white/50'
                  }`}
                >
                  <p className="font-display text-sm text-brown">
                    <span aria-hidden="true">{s.emoji} </span>
                    {s.name}
                    {isNow && <span className="ml-2 text-ever-green">✦ Now</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-brown/75">{s.blurb}</p>
                  <p className="mt-1 text-xs text-brown/55">
                    {s.threshold === 0 ? 'Where every sanctuary begins' : `Grows in at ${s.threshold} trees`}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
