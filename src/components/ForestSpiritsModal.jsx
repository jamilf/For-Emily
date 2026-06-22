import { useEffect, useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import ProceduralSpirit from './ProceduralSpirit.jsx'
import {
  SPIRITS,
  spiritMetrics,
  progressForSpirit,
  hintForSpirit,
  isUnlocked,
  unlockedCount,
  reconcileSpirits,
} from '../data/spirits.js'

const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }
const EMPTY_SPIRITS = { unlocked: {}, seen: {}, discoveredAt: {} }
const FILTERS = ['all', 'found', 'locked']

/** "Jun 20" from an epoch-ms discovery timestamp, or "undated" when retroactive. */
function discoveredLabel(ts) {
  if (ts == null) return 'undated'
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Forest Spirits — a cozy companion collection. Spirits appear retroactively from
 * study habits (same sticky engine as the Grove Almanac). Unlocked spirits show
 * the full creature + discovery date; locked ones show a faded silhouette + a hint
 * + live progress. State is conveyed by text + shape, never colour alone. A lazy
 * modal matching the app's overlay chrome (focus trap, backdrop, Esc, return-focus).
 */
export default function ForestSpiritsModal({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [spirits, setSpirits] = usePersistedState('emily.spirits', EMPTY_SPIRITS)

  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [celebrate, setCelebrate] = useState([])

  // Honor reduced motion (and make it testable): no idle drift when set. The global
  // CSS rule also zeroes animations, but gating here gives a clean static fallback.
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])
  const idle = reduced ? '' : 'animate-float'

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  // Snapshot which spirits were already "seen" BEFORE this open, so the "new!"
  // badge can show this time even though we mark them seen on open.
  const seenBefore = useRef(spirits.seen || {})

  const metrics = useMemo(
    () => spiritMetrics({ garden, stats, flashcardStats, reflections }),
    [garden, stats, flashcardStats, reflections],
  )

  // Reconcile sticky unlocks once on open; discover anything newly earned (now),
  // then mark all unlocked spirits as seen so the "new!" badge clears next time.
  const reconciled = useRef(false)
  useEffect(() => {
    if (reconciled.current) return
    reconciled.current = true
    const { state: next, newlyUnlocked } = reconcileSpirits(spirits, metrics, Date.now())
    const seen = { ...next.seen }
    for (const id of Object.keys(next.unlocked)) seen[id] = true
    setSpirits({ ...next, seen })
    if (newlyUnlocked.length > 0) setCelebrate(newlyUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = SPIRITS.length
  const foundCount = unlockedCount(spirits)

  const cards = useMemo(() => {
    const rows = SPIRITS.map((spirit) => ({
      spirit,
      unlocked: isUnlocked(spirit, spirits),
      progress: progressForSpirit(spirit, metrics),
      isNew: isUnlocked(spirit, spirits) && !seenBefore.current[spirit.id],
      discoveredAt: spirits.discoveredAt?.[spirit.id] ?? null,
    }))
    const filtered = rows.filter((r) =>
      filter === 'found' ? r.unlocked : filter === 'locked' ? !r.unlocked : true,
    )
    return filtered.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      if (a.unlocked) return 0
      return b.progress.current / b.progress.target - a.progress.current / a.progress.target
    })
  }, [spirits, metrics, filter])

  const selected = selectedId ? cards.find((c) => c.spirit.id === selectedId) : null

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
        aria-label="Forest Spirits"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌲 Forest Spirits
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close forest spirits"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-4 overflow-y-auto bg-cream p-5 text-brownDark">
          {selected ? (
            <SpiritDetail row={selected} idle={idle} onBack={() => setSelectedId(null)} />
          ) : (
            <>
              {celebrate.length > 0 && (
                <div
                  className="rounded-2xl border-2 border-ever-green/40 bg-ever-green/15 p-3 text-center"
                  aria-live="polite"
                >
                  <p className="font-display text-brown">A spirit found you! ✨</p>
                  <div className="mt-2 flex flex-wrap items-end justify-center gap-3">
                    {celebrate.map((s) => (
                      <div key={s.id} className="flex flex-col items-center">
                        <ProceduralSpirit spiritId={s.id} pixel={3} className="animate-pixel-pop" />
                        <span className="mt-1 font-display text-xs text-brown">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-display text-lg text-brown">
                  {foundCount} of {total} spirits have found you 🌲
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brown/10">
                  <div
                    className="h-full rounded-full bg-ever-green transition-[width] duration-500"
                    style={{ width: `${Math.round((foundCount / total) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-brown/60">
                  Spirits are companions, not trophies. They arrive from the habits you already keep, and a
                  quiet stretch never sends one away.
                </p>
              </div>

              <div className="flex items-center gap-1.5 font-display text-xs">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-full px-3 py-1 capitalize transition-colors ${
                      filter === f ? 'bg-brown text-cream' : 'bg-brown/10 text-brown hover:bg-brown/20'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map(({ spirit, unlocked, progress, isNew, discoveredAt }) => (
                  <li key={spirit.id}>
                    <button
                      onClick={() => setSelectedId(spirit.id)}
                      className="flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-brown/15 bg-white/55 p-3 text-center transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ever-yellow"
                      aria-label={
                        unlocked
                          ? `${spirit.name}${isNew ? ', new' : ''}, found, discovered ${discoveredLabel(discoveredAt)}`
                          : `${spirit.name}, locked, ${hintForSpirit(spirit)}, ${progress.current} of ${progress.target}`
                      }
                    >
                      <ProceduralSpirit
                        spiritId={spirit.id}
                        pixel={4}
                        state={unlocked ? 'unlocked' : 'locked'}
                        className={unlocked ? idle : ''}
                      />
                      <span className="font-display text-xs text-brown">{spirit.name}</span>
                      {unlocked ? (
                        <span className="text-[0.65rem] text-brown/55">
                          {isNew ? (
                            <span className="font-display text-ever-green">new!</span>
                          ) : (
                            `found ${discoveredLabel(discoveredAt)}`
                          )}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[0.65rem] text-brown/55">
                          <span aria-hidden="true">🔒</span>
                          {progress.current}/{progress.target}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SpiritDetail({ row, idle, onBack }) {
  const { spirit, unlocked, progress, discoveredAt } = row
  return (
    <div className="space-y-4 text-center">
      <button
        onClick={onBack}
        className="font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        ← Back to the spirits
      </button>
      <div className="flex justify-center">
        <ProceduralSpirit
          spiritId={spirit.id}
          pixel={8}
          state={unlocked ? 'unlocked' : 'locked'}
          className={unlocked ? idle : ''}
        />
      </div>
      <p className="font-display text-xl text-brown">{spirit.name}</p>
      <p className="mx-auto max-w-sm text-sm text-brown/75">{spirit.blurb}</p>

      {unlocked ? (
        <p className="text-xs text-brown/60" aria-live="polite">
          {discoveredAt == null
            ? 'Already with you when the spirits awoke.'
            : `Discovered ${discoveredLabel(discoveredAt)}.`}
        </p>
      ) : (
        <div className="mx-auto max-w-xs">
          <p className="text-sm text-brown/75">{hintForSpirit(spirit)}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brown/10">
            <div
              className="h-full rounded-full bg-ever-green transition-[width] duration-500"
              style={{ width: `${Math.round((progress.current / progress.target) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-brown/55" aria-live="polite">
            {progress.current} / {progress.target}
          </p>
        </div>
      )}
    </div>
  )
}
