import WindowFrame from './WindowFrame.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import { DEFAULTS } from '../storage/StorageManager.js'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }
const R = 52
const C = 2 * Math.PI * R

/**
 * Feature 7 — ADHD Focus Meter. Positive-only reinforcement: a progress ring
 * toward a gentle daily goal plus warm stat tiles. Never any red, failure, or
 * shame language — only encouragement and recovery. Laid out as a vertical card
 * (ring over a row of tiles) so it reads cleanly in the narrow side rail.
 */
export default function FocusMeter({ className = '' }) {
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [garden] = usePersistedState('emily.garden', [])
  const [meter] = usePersistedState('emily.meter', DEFAULTS['emily.meter'])

  const today = todayStr()
  const minutes = stats.day === today ? stats.minutesToday : 0
  const sessions = stats.day === today ? stats.sessionsToday : 0
  const goal = meter.dailyGoalMin || 100
  const frac = Math.min(1, minutes / goal)
  const offset = C * (1 - frac)

  const message =
    frac >= 1
      ? 'You hit your goal for today.'
      : minutes > 0
        ? 'Good start. Keep going.'
        : 'Nothing logged yet today. Start when you want.'

  const Tile = ({ value, label, icon }) => (
    <div className="rounded-xl bg-brown/5 px-2 py-2.5 text-center sm:px-3">
      <div className="font-display text-lg text-brown">
        <span aria-hidden="true">{icon} </span>
        {value}
      </div>
      <div className="mt-0.5 text-[0.7rem] leading-tight text-brown/60">{label}</div>
    </div>
  )

  return (
    <WindowFrame title="Focus Meter" className={className}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <svg viewBox="0 0 132 132" className="h-full w-full" aria-hidden="true">
            <circle cx="66" cy="66" r={R} fill="none" stroke="#8F5E36" strokeOpacity="0.12" strokeWidth="12" />
            <circle
              cx="66"
              cy="66"
              r={R}
              fill="none"
              stroke="#F9A857"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              transform="rotate(-90 66 66)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl text-brown">{minutes}</span>
            <span className="text-xs text-brown/60">of {goal} min</span>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
          <Tile value={sessions} label="sessions today" icon="🍃" />
          <Tile value={stats.streak || 0} label="day streak" icon="🌱" />
          <Tile value={garden.length} label="trees grown" icon="🌳" />
        </div>

        <p className="text-center text-sm text-brown/70" aria-live="polite">
          {message}
        </p>
      </div>
    </WindowFrame>
  )
}
