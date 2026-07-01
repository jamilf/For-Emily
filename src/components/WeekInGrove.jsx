import { useMemo } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'
import StatusPanel, { StatGauge } from '../ui/jrpg/StatusPanel.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import { weekReview } from '../data/weekReview.js'

/**
 * "Your week in the grove" — a small, fully derived weekly reflection. It reads the
 * data the app already keeps (focusLog, garden, reflections, stats) and gives Emily
 * a kind look back: how this week compares to last, when she tends to focus, and a
 * gentle replay of her own post-session check-ins, which until now were recorded but
 * never shown again. Positive-only, never shaming: a quieter week is a week for
 * resting, never a failure. No new persistence.
 */

// The reflection moods, matching ReflectionModal exactly so the look-back is faithful.
const MOODS = {
  rain: { icon: '🌧️', label: 'Tough' },
  cloud: { icon: '🌤️', label: 'Okay' },
  sun: { icon: '☀️', label: 'Great' },
}

const PART_TEXT = {
  morning: 'You focus best in the morning.',
  afternoon: 'You focus best in the afternoon.',
  evening: 'You focus best in the evening.',
  night: 'You focus best late at night.',
}

// A warm, never-shaming line for the top of the panel, chosen from the trend.
function summaryLine(trend, thisWeek) {
  if (thisWeek.sessions === 0) return 'A fresh week, open and waiting. Whenever you are ready.'
  switch (trend) {
    case 'up':
      return 'More little trees than last week. Lovely momentum.'
    case 'down':
      return 'A quieter week than last. Some weeks are for resting, and that counts too.'
    case 'steady':
      return 'A steady week, much like the last. Consistency is its own kind of magic.'
    default: // 'first'
      return 'Your first trees are in the ground. A grove begins with one.'
  }
}

// "today" / "yesterday" / weekday / short date, relative to the panel's open time.
function relativeDay(ts, today) {
  const a = new Date(new Date(ts).getFullYear(), new Date(ts).getMonth(), new Date(ts).getDate())
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diff = Math.round((b - a) / 86_400_000)
  if (diff <= 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return new Date(ts).toLocaleDateString(undefined, { weekday: 'long' })
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function WeekInGrove({ onClose }) {
  const [log] = usePersistedState('emily.focusLog', {})
  const [garden] = usePersistedState('emily.garden', [])
  const [reflections] = usePersistedState('emily.reflections', [])
  const [stats] = usePersistedState('emily.stats', { streak: 0 })

  // Anchor "now" once for the panel's lifetime so the review and relative dates stay
  // consistent across re-renders.
  const today = useMemo(() => new Date(), [])
  const review = useMemo(
    () => weekReview(log, { today, garden, reflections, streak: stats.streak || 0 }),
    [log, garden, reflections, stats.streak, today],
  )

  const { thisWeek, lastWeek, trend, bestPartOfDay, recentReflections } = review
  const summary = summaryLine(trend, thisWeek)
  const sessionsMax = Math.max(thisWeek.sessions, lastWeek.sessions, 1)
  const minutesMax = Math.max(thisWeek.minutes, lastWeek.minutes, 1)

  return (
    <GameWindow
      modal
      title="🌿 Your week"
      onClose={onClose}
      closeLabel="Close your week"
      widthClass="max-w-md"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      <p className="text-sm leading-snug text-brown/80" aria-live="polite">
        {summary}
      </p>

      <StatusPanel title="This week in the grove">
        <StatGauge
          label="Focus sessions"
          icon="🍃"
          value={thisWeek.sessions}
          max={sessionsMax}
          tone="green"
          valueText={`${thisWeek.sessions} this week, ${lastWeek.sessions} last`}
        />
        <StatGauge
          label="Focus minutes"
          icon="🔆"
          value={thisWeek.minutes}
          max={minutesMax}
          tone="gold"
          valueText={`${thisWeek.minutes} this week, ${lastWeek.minutes} last`}
        />
      </StatusPanel>

      {bestPartOfDay && <p className="text-sm text-brown/70">🕊️ {PART_TEXT[bestPartOfDay]}</p>}

      <section aria-label="Recent check-ins" className="space-y-2">
        <p className="font-display text-xs uppercase tracking-wide text-brown/55">Recent check-ins</p>
        {recentReflections.length === 0 ? (
          <p className="text-sm text-brown/60">Your reflections will gather here after focus sessions.</p>
        ) : (
          <ul className="space-y-2">
            {recentReflections.map((r) => {
              const mood = MOODS[r.mood] || MOODS.cloud
              return (
                <li key={r.ts} className="flex gap-2 rounded-xl bg-brown/5 px-3 py-2">
                  <span aria-hidden="true" className="text-lg leading-none">
                    {mood.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-xs text-brown">
                      {mood.label} <span className="text-brown/50">· {relativeDay(r.ts, today)}</span>
                    </p>
                    {r.note && <p className="mt-0.5 text-sm text-brown/75">{r.note}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </GameWindow>
  )
}
