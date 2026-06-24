import usePersistedState from '../hooks/useLocalStorage.js'
import { SEASONS, seasonProgress } from '../data/seasons.js'
import GameWindow from '../ui/jrpg/GameWindow.jsx'

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

  const progressLine = next
    ? `${season.name}, ${remaining} more ${remaining === 1 ? 'tree' : 'trees'} until ${next.name}.`
    : `${season.name}, the deepest season. Your sanctuary is in full bloom of rest.`

  return (
    <GameWindow
      modal
      title={`${season.emoji} Sanctuary Seasons`}
      ariaLabel="Sanctuary Seasons"
      onClose={onClose}
      closeLabel="Close seasons"
      widthClass="max-w-md"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      <p className="text-sm text-brown/75">
        Your world changes with your grove, not the calendar. Every tree you grow nudges the seasons along.
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
    </GameWindow>
  )
}
