import { useEffect, useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import ProceduralTree from './ProceduralTree.jsx'
import {
  SPECIES,
  dnaOf,
  groveMetrics,
  progressFor,
  hintFor,
  timesGrown,
  isUnlocked,
  unlockedCount,
  reconcile,
  nextBloom,
} from '../data/grove.js'

const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }
const FILTERS = ['all', 'grown', 'locked']

/**
 * The Grove Almanac — a cozy seed-catalogue of every tree varietal, drawn by the
 * real procedural generator. Unlocked entries show the full tree + stats; locked
 * ones show a faded silhouette + lock + hint + live progress. A lazy modal that
 * matches the app's overlay chrome (focus trap, backdrop, Esc).
 */
export default function GroveAlmanac({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [grove, setGrove] = usePersistedState('emily.grove', { unlocked: {}, plantNext: null })

  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [celebrate, setCelebrate] = useState([])
  const [planted, setPlanted] = useState(null) // id just queued via "Grow this next"

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const metrics = useMemo(
    () => groveMetrics({ garden, stats, flashcardStats, reflections }),
    [garden, stats, flashcardStats, reflections],
  )

  // Reconcile sticky unlocks once on open; surface anything newly earned.
  const reconciled = useRef(false)
  useEffect(() => {
    if (reconciled.current) return
    reconciled.current = true
    const { grove: next, newlyUnlocked } = reconcile(grove, metrics)
    if (newlyUnlocked.length > 0) {
      setGrove(next)
      setCelebrate(newlyUnlocked)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = SPECIES.length
  const grownCount = unlockedCount(grove)
  const goal = useMemo(() => nextBloom(grove, metrics), [grove, metrics])

  const cards = useMemo(() => {
    const rows = SPECIES.map((species) => {
      const unlocked = isUnlocked(species, grove)
      return {
        species,
        unlocked,
        progress: progressFor(species, metrics),
        times: timesGrown(species, garden),
      }
    })
    const filtered = rows.filter((r) =>
      filter === 'grown' ? r.unlocked : filter === 'locked' ? !r.unlocked : true,
    )
    // Grown first, then locked sorted by closest to unlocking.
    return filtered.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      if (a.unlocked) return 0
      const ar = a.progress.current / a.progress.target
      const br = b.progress.current / b.progress.target
      return br - ar
    })
  }, [grove, metrics, garden, filter])

  const selected = selectedId ? cards.find((c) => c.species.id === selectedId) : null

  function growThisNext(species) {
    setGrove((g) => ({ ...g, plantNext: dnaOf(species) }))
    setPlanted(species.id)
  }

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
        aria-label="Grove Almanac"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌿 Grove Almanac
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close almanac"
            className="grid h-10 w-10 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-4 overflow-y-auto bg-cream p-5 text-brownDark">
          {selected ? (
            <GroveDetail
              row={selected}
              planted={planted === selected.species.id}
              onPlant={() => growThisNext(selected.species)}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <>
              {/* Celebration */}
              {celebrate.length > 0 && (
                <div
                  className="rounded-2xl border-2 border-ever-green/40 bg-ever-green/15 p-3 text-center"
                  aria-live="polite"
                >
                  <p className="font-display text-brown">A new varietal! 🌱</p>
                  <div className="mt-2 flex flex-wrap items-end justify-center gap-3">
                    {celebrate.map((s) => (
                      <div key={s.id} className="flex flex-col items-center">
                        <ProceduralTree
                          dna={dnaOf(s)}
                          stage={s.stage}
                          pixel={3}
                          className="animate-pixel-pop"
                        />
                        <span className="mt-1 font-display text-xs text-brown">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header + progress */}
              <div>
                <p className="font-display text-lg text-brown">
                  You&apos;ve grown {grownCount} of {total}. Your grove is filling in 🌿
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brown/10">
                  <div
                    className="h-full rounded-full bg-ever-green transition-[width] duration-500"
                    style={{ width: `${Math.round((grownCount / total) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Next bloom */}
              {goal && (
                <button
                  onClick={() => setSelectedId(goal.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-brown/15 bg-white/60 p-3 text-left transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ever-yellow"
                >
                  <ProceduralTree dna={dnaOf(goal)} stage={goal.stage} pixel={3} state="locked" />
                  <span className="min-w-0">
                    <span className="block font-display text-sm text-brown">Your next bloom</span>
                    <span className="block text-xs text-brown/70">{hintFor(goal)}</span>
                    <span className="block text-xs text-brown/55">
                      {progressFor(goal, metrics).current} / {progressFor(goal, metrics).target}
                    </span>
                  </span>
                </button>
              )}

              {/* Filter */}
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

              {/* Grid */}
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cards.map(({ species, unlocked, progress, times }) => (
                  <li key={species.id}>
                    <button
                      onClick={() => setSelectedId(species.id)}
                      className="flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-brown/15 bg-white/55 p-3 text-center transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ever-yellow"
                      aria-label={
                        unlocked
                          ? `${species.name}, grown${times ? `, grown ${times} times` : ''}`
                          : `${species.mystery ? 'Mystery varietal' : species.name}, locked, ${hintFor(species)}, ${progress.current} of ${progress.target}`
                      }
                    >
                      <ProceduralTree
                        dna={dnaOf(species)}
                        stage={species.stage}
                        pixel={4}
                        state={unlocked ? 'unlocked' : 'locked'}
                      />
                      <span className="font-display text-xs text-brown">
                        {unlocked ? species.name : species.mystery ? '???' : species.name}
                      </span>
                      {unlocked ? (
                        <span className="text-[0.65rem] text-brown/55">
                          {times > 0 ? `grown ${times}×` : 'new'}
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
              <p className="text-center text-xs text-brown/50">
                Every varietal is drawn by the same generator that grows your trees. Unlocks are pure reward,
                and a missed day never takes one away.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function GroveDetail({ row, planted, onPlant, onBack }) {
  const { species, unlocked, progress, times } = row
  const showName = unlocked || !species.mystery
  return (
    <div className="space-y-4 text-center">
      <button
        onClick={onBack}
        className="font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        ← Back to the grove
      </button>
      <div className="flex justify-center">
        <ProceduralTree
          dna={dnaOf(species)}
          stage={species.stage}
          pixel={7}
          state={unlocked ? 'unlocked' : 'locked'}
        />
      </div>
      <p className="font-display text-xl text-brown">{showName ? species.name : '??? a mystery seed'}</p>
      {(unlocked || !species.mystery) && (
        <p className="mx-auto max-w-sm text-sm text-brown/75">{species.flavor}</p>
      )}

      {unlocked ? (
        <>
          <p className="text-xs text-brown/60" aria-live="polite">
            Grown {times} time{times === 1 ? '' : 's'}.
          </p>
          <button
            onClick={onPlant}
            disabled={planted}
            className="rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-60"
          >
            {planted ? 'Set. Your next session grows this 🌱' : 'Grow this one next'}
          </button>
        </>
      ) : (
        <div className="mx-auto max-w-xs">
          <p className="text-sm text-brown/75">{hintFor(species)}</p>
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
