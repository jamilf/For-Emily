import { useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import ProceduralTree from './ProceduralTree.jsx'
import ProceduralSpirit from './ProceduralSpirit.jsx'
import { buildJournal, searchJournal } from '../data/journal.js'

const inputCls =
  'w-full rounded-xl border-2 border-brown/20 bg-white/70 p-2.5 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow'
const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }

function monthLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}
function dayLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Group already-sorted (desc) entries into month buckets, preserving order. */
function groupByMonth(entries) {
  const groups = []
  let current = null
  for (const e of entries) {
    const d = new Date(e.ts)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!current || current.key !== key) {
      current = { key, label: monthLabel(e.ts), items: [] }
      groups.push(current)
    }
    current.items.push(e)
  }
  return groups
}

/** The little pixel portrait for an entry — a tree, a spirit, or just its icon. */
function EntryArt({ entry }) {
  if (entry.spiritId) return <ProceduralSpirit spiritId={entry.spiritId} pixel={3} />
  if (entry.dna != null) return <ProceduralTree dna={entry.dna} stage="mature" pixel={3} />
  return (
    <span aria-hidden="true" className="grid h-10 w-10 place-items-center text-2xl">
      {entry.icon}
    </span>
  )
}

function EntryRow({ entry }) {
  return (
    <li className="flex gap-3 rounded-2xl border-2 border-brown/15 bg-white/55 p-3">
      <div className="flex w-10 shrink-0 items-center justify-center">
        <EntryArt entry={entry} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm text-brown">
          <span aria-hidden="true">{entry.icon} </span>
          {entry.title}
        </p>
        {entry.detail && <p className="mt-0.5 text-sm text-brown/75">{entry.detail}</p>}
        {entry.ts != null && <p className="mt-1 text-xs text-brown/55">{dayLabel(entry.ts)}</p>}
      </div>
    </li>
  )
}

/**
 * The Journal — a cozy, read-only timeline of meaningful moments, derived entirely
 * from existing data (no new persistence/sync). Entries are grouped by month and
 * conveyed by text + icon + pixel art, never colour alone. A lazy modal matching
 * the app's overlay chrome (focus trap, backdrop, Esc, return-focus).
 */
export default function Journal({ onClose }) {
  const [memories] = usePersistedState('emily.memories', [])
  const [spirits] = usePersistedState('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })
  const [grove] = usePersistedState('emily.grove', { unlocked: {}, plantNext: null })
  const [garden] = usePersistedState('emily.garden', [])
  const [keepsakes] = usePersistedState('emily.keepsakes', [])
  const [reflections] = usePersistedState('emily.reflections', [])
  const [focusLog] = usePersistedState('emily.focusLog', {})
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)

  const [search, setSearch] = useState('')

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const { entries, undated } = useMemo(
    () => buildJournal({ memories, spirits, grove, garden, keepsakes, reflections }),
    [memories, spirits, grove, garden, keepsakes, reflections],
  )

  const filteredEntries = useMemo(() => searchJournal(entries, search), [entries, search])
  const filteredUndated = useMemo(() => searchJournal(undated, search), [undated, search])
  const groups = useMemo(() => groupByMonth(filteredEntries), [filteredEntries])

  const summary = useMemo(() => {
    const daysStudied = Object.values(focusLog).filter((d) => d && d.sessions > 0).length
    return [
      ['Memories', memories.length],
      ['Spirits', Object.keys(spirits.unlocked || {}).length],
      ['Varietals', Object.keys(grove.unlocked || {}).length],
      ['Letters', keepsakes.length],
      ['Days studied', daysStudied],
      ['Day streak', stats.streak || 0],
    ]
  }, [memories, spirits, grove, keepsakes, focusLog, stats])

  const total = entries.length + undated.length
  const shown = filteredEntries.length + filteredUndated.length

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
        aria-label="Your Journal"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            📔 Your Journal
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close journal"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-4 overflow-y-auto bg-cream p-5 text-brownDark">
          <p className="text-sm text-brown/75">
            A look back at the moments you&apos;ve made: memories, the spirits that found you, and the grove
            you&apos;ve grown, one session at a time.
          </p>

          {/* Summary */}
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {summary.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-brown/5 px-2 py-2 text-center">
                <dt className="text-[0.6rem] uppercase tracking-wide text-brown/55">{label}</dt>
                <dd className="font-display text-base text-brown">{value}</dd>
              </div>
            ))}
          </dl>

          {total === 0 ? (
            <p className="py-6 text-center text-sm text-brown/70">
              Your journal fills in as you study. Finish a session, dedicate a memory, meet a spirit. The
              first page is waiting for you.
            </p>
          ) : (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your journal…"
                aria-label="Search your journal"
                className={inputCls}
              />
              <p className="sr-only" aria-live="polite">
                {shown} {shown === 1 ? 'entry' : 'entries'} shown
              </p>

              {shown === 0 ? (
                <p className="py-4 text-center text-sm text-brown/70">No entries match “{search}”.</p>
              ) : (
                <>
                  {groups.map((group) => (
                    <section key={group.key}>
                      <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-brown/60">
                        {group.label}
                      </h3>
                      <ul className="space-y-2">
                        {group.items.map((entry) => (
                          <EntryRow key={entry.key} entry={entry} />
                        ))}
                      </ul>
                    </section>
                  ))}

                  {filteredUndated.length > 0 && (
                    <section>
                      <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-brown/60">
                        From before your journal began
                      </h3>
                      <ul className="space-y-2">
                        {filteredUndated.map((entry) => (
                          <li
                            key={entry.key}
                            className="flex gap-3 rounded-2xl border-2 border-brown/15 bg-white/55 p-3"
                          >
                            <div className="flex w-10 shrink-0 items-center justify-center">
                              <EntryArt entry={entry} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-sm text-brown">
                                <span aria-hidden="true">{entry.icon} </span>
                                {entry.title}
                              </p>
                              <p className="mt-0.5 text-sm text-brown/75">{entry.detail}</p>
                              <p className="mt-1 text-xs text-brown/55">undated</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
