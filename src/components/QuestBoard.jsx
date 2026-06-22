import { useMemo, useRef } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
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

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

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
        aria-label="Focus Quests"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            📜 Focus Quests
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close quests"
            className="grid h-10 w-10 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-4 overflow-y-auto bg-cream p-5 text-brownDark">
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
        </div>
      </div>
    </div>
  )
}
