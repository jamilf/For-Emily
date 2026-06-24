import { useMemo } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import ProceduralSpirit from './ProceduralSpirit.jsx'
import { localDayStr } from '../data/scheduler.js'
import { dailyQuests, questMetricsToday, evaluateQuests, questSummary } from '../data/quests.js'

/**
 * Focus Quest Board — a few gentle daily objectives that cannot be failed. The set is
 * deterministic from today's local date and completion is computed live from existing
 * metrics; nothing is stored. No expiry, no fail/red state, no currency. The only
 * reward is a small, reduced-motion-aware celebration. A lazy, focus-trapped modal.
 */
export default function QuestBoard({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [spirits] = usePersistedState('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })

  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  const now = useMemo(() => new Date(), [])
  const evaluated = useMemo(() => {
    const quests = dailyQuests(localDayStr(now))
    const metrics = questMetricsToday({ garden, flashcardStats, reflections }, now)
    return evaluateQuests(quests, metrics)
  }, [garden, flashcardStats, reflections, now])

  const { done, total } = questSummary(evaluated)
  const allDone = total > 0 && done === total

  // Optional celebration nod to an unlocked spirit (works fine without one).
  const nodSpiritId = useMemo(() => {
    const ids = Object.keys(spirits.unlocked || {})
    return ids.length ? ids[0] : null
  }, [spirits])

  return (
    <GameWindow
      modal
      title="📜 Focus Quests"
      ariaLabel="Focus Quests"
      onClose={onClose}
      closeLabel="Close quests"
      widthClass="max-w-md"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      <div>
        <p className="font-display text-lg text-brown" aria-live="polite">
          {done} of {total} quests tended today
        </p>
        <p className="mt-1 text-xs text-brown/60">
          A fresh set arrives each morning. Nothing to fail here, no streak to break. Tend what you can.
        </p>
      </div>

      {allDone && (
        <div
          className="rounded-2xl border-2 border-ever-green/40 bg-ever-green/15 p-3 text-center"
          aria-live="polite"
        >
          <p className="font-display text-brown">✨ All tended today. Beautifully done.</p>
          <div className="mt-2 flex items-center justify-center">
            {nodSpiritId ? (
              <ProceduralSpirit
                spiritId={nodSpiritId}
                pixel={3}
                className={reduced ? '' : 'animate-pixel-pop'}
              />
            ) : (
              <span aria-hidden="true" className={`text-2xl ${reduced ? '' : 'animate-pixel-pop'}`}>
                🌟
              </span>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {evaluated.map((q) => {
          const numeric = q.target > 1
          return (
            <li
              key={q.id}
              className="flex items-start gap-3 rounded-2xl border-2 border-brown/15 bg-white/55 p-3"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {q.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm text-brown">{q.label}</p>
                <p className="mt-0.5 text-xs text-brown/60">{q.hint}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs font-bold">
                {q.done ? (
                  <span className="text-ever-green">✓ Done</span>
                ) : numeric ? (
                  <span className="text-brown/60">
                    {q.current} / {q.target}
                  </span>
                ) : (
                  <span className="text-brown/55">Not yet</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </GameWindow>
  )
}
