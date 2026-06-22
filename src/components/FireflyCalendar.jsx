import { useMemo, useRef, useState } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import usePersistedState from '../hooks/useLocalStorage.js'
import { lastNWeeks, summarize, bucketFor, activeWithin } from '../data/focusLog.js'

// How many week-columns the meadow spans. Wide enough to read a season at a
// glance; the grid scrolls horizontally on narrow screens (no data is hidden).
const WEEKS = 16
const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }
// Lane labels: only a few, GitHub-style, to keep the meadow uncluttered.
const LANE_LABEL = { 1: 'Mon', 3: 'Wed', 5: 'Fri' }

const hourOf = (ts) => new Date(ts).getHours()

/** Grid position of today (always present in the last column); falls back safely. */
function findToday(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].isToday) return { row: r, col: c }
    }
  }
  return { row: 0, col: grid[0].length - 1 }
}

/** "Tue, Jun 10" from a local YYYY-MM-DD. */
function prettyDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

/** Accessible name for a cell — count + optional known minutes, never shaming. */
function cellLabel(cell) {
  const when = prettyDay(cell.ymd)
  if (cell.sessions <= 0) return `${when}: no sessions yet`
  const plural = cell.sessions === 1 ? 'focus session' : 'focus sessions'
  const mins = cell.minutes != null ? `, ~${cell.minutes} min` : ''
  return `${when}: ${cell.sessions} ${plural}${mins}`
}

/** A friendlier, longer phrasing for the live detail region. */
function detailLine(cell) {
  const when = prettyDay(cell.ymd)
  if (cell.sessions <= 0) return `${when}: a quiet day. No fireflies yet, and that's perfectly okay.`
  const fly = cell.sessions === 1 ? 'firefly' : 'fireflies'
  const sess = cell.sessions === 1 ? 'session' : 'sessions'
  const mins = cell.minutes != null ? ` · about ${cell.minutes} min of focus` : ''
  return `${when}: ${cell.sessions} ${fly} lit, ${cell.sessions} focus ${sess}${mins}.`
}

/** Format a minutes total as "2h 5m" / "45m". */
function prettyMinutes(total) {
  if (!total) return '0m'
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`
}

/** Static firefly dots (count = bucket). Twinkle only when motion is allowed. */
function Fireflies({ count, reduced }) {
  if (count <= 0) return null
  const dots = []
  for (let i = 0; i < count; i++) {
    dots.push(
      <span
        key={i}
        className={`block h-1 w-1 rounded-full bg-ever-yellow ${reduced ? '' : 'animate-twinkle'}`}
        style={{
          boxShadow: '0 0 3px 0.5px rgba(219,188,127,0.9)',
          animationDelay: reduced ? undefined : `${i * 0.4}s`,
        }}
      />,
    )
  }
  return (
    <span aria-hidden="true" className="grid grid-cols-2 place-content-center gap-[2px]">
      {dots}
    </span>
  )
}

/**
 * Phase-11 — the Firefly Calendar. A cozy, non-shaming consistency map: a dusk
 * meadow where each completed focus session lights one firefly on its day. Opens
 * as a lazy, focus-trapped modal (same shell as every other dialog in the app).
 * Day intensity is conveyed three ways — firefly count, a numeric badge, and the
 * accessible label — never by colour alone. Empty days stay calm; future days are
 * inert. The streak shown is the Focus Meter's, reused (never recomputed here).
 */
export default function FireflyCalendar({ onClose }) {
  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const [log] = usePersistedState('emily.focusLog', {})
  const [garden] = usePersistedState('emily.garden', [])
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)

  // Stable "today" for this open session so the grid/memos don't churn.
  const today = useMemo(() => new Date(), [])
  const grid = useMemo(() => lastNWeeks(log, today, WEEKS), [log, today])
  const summary = useMemo(() => summarize(log, { streak: stats.streak || 0 }), [log, stats.streak])

  // Honor reduced motion (and make it testable): static fireflies when set.
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  // Roving-tabindex focus position; start on today (never a future cell).
  const [focus, setFocus] = useState(() => findToday(grid))
  const [selected, setSelected] = useState(() => {
    const p = findToday(grid)
    return grid[p.row][p.col]
  })

  const cellRefs = useRef({})
  const keyOf = (r, c) => `${r}:${c}`

  function moveTo(row, col) {
    const cell = grid[row]?.[col]
    if (!cell || cell.inFuture) return
    setFocus({ row, col })
    cellRefs.current[keyOf(row, col)]?.focus()
  }

  function lastPastCol(row) {
    for (let c = WEEKS - 1; c >= 0; c--) {
      if (!grid[row][c].inFuture) return c
    }
    return 0
  }

  function onCellKeyDown(e, row, col) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        moveTo(row, col - 1)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveTo(row, col + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveTo(row - 1, col)
        break
      case 'ArrowDown':
        e.preventDefault()
        moveTo(row + 1, col)
        break
      case 'Home':
        e.preventDefault()
        moveTo(row, 0)
        break
      case 'End':
        e.preventDefault()
        moveTo(row, lastPastCol(row))
        break
      default:
        break
    }
  }

  const insights = useMemo(() => buildInsights(log, garden, today), [log, garden, today])
  const bestDayText = summary.bestDay
    ? `${prettyDay(summary.bestDay.ymd)} (${summary.bestDay.sessions})`
    : 'none yet'

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
        aria-label="Firefly Calendar"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            ✨ Firefly Calendar
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close calendar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto bg-bg0 p-5 text-fg">
          <p className="text-sm text-fg/80">
            Every completed focus session lights one firefly in your meadow. This is a record of when you
            tended your grove. Quiet days are simply quiet, never a failure.
          </p>

          {/* Header summary */}
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ['Sessions', summary.totalSessions],
              ['Focus time', prettyMinutes(summary.totalKnownMinutes)],
              ['Active days', summary.activeDays],
              ['Day streak', summary.currentStreak],
              ['Brightest', bestDayText],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-bg2/60 px-2 py-2 text-center">
                <dt className="text-[0.65rem] uppercase tracking-wide text-fg/55">{label}</dt>
                <dd className="font-display text-sm text-ever-yellow">{value}</dd>
              </div>
            ))}
          </dl>

          {/* The meadow grid (horizontal scroll contained so it can't rubber-band
              the page; vertical page scroll still passes through). */}
          <div
            className="room-vignette touch-pan-x overflow-x-auto overscroll-x-contain rounded-xl bg-bgDim/60 p-3"
            style={{ background: 'linear-gradient(to bottom, #2D353B, #232A2E)' }}
          >
            <div role="group" aria-label="Your focus meadow: the most recent weeks, by day">
              {grid.map((lane, row) => (
                <div key={row} className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="w-7 shrink-0 pr-1 text-right text-[0.55rem] leading-6 text-fg/45"
                  >
                    {LANE_LABEL[row] || ''}
                  </span>
                  {lane.map((cell, col) => {
                    if (cell.inFuture) {
                      return (
                        <div
                          key={col}
                          aria-hidden="true"
                          className="h-6 w-6 shrink-0 rounded-sm border border-bg3/30 bg-bg1/30 sm:h-7 sm:w-7"
                        />
                      )
                    }
                    const bucket = bucketFor(cell.sessions)
                    const isFocusCell = focus.row === row && focus.col === col
                    const isSelected = selected && selected.ymd === cell.ymd
                    return (
                      <button
                        key={col}
                        type="button"
                        ref={(el) => {
                          cellRefs.current[keyOf(row, col)] = el
                        }}
                        tabIndex={isFocusCell ? 0 : -1}
                        aria-label={cellLabel(cell)}
                        aria-pressed={isSelected}
                        title={cellLabel(cell)}
                        onKeyDown={(e) => onCellKeyDown(e, row, col)}
                        onFocus={() => setFocus({ row, col })}
                        onClick={() => setSelected(cell)}
                        className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-sm border bg-bg2/70 transition-shadow focus:outline-none sm:h-7 sm:w-7 ${
                          cell.isToday ? 'border-ever-yellow' : 'border-bg3/50'
                        } ${
                          isSelected
                            ? 'ring-2 ring-ever-aqua'
                            : 'focus-visible:ring-2 focus-visible:ring-ever-yellow'
                        }`}
                        style={
                          bucket > 0
                            ? { backgroundColor: `rgba(167,192,128,${0.12 + bucket * 0.16})` }
                            : undefined
                        }
                      >
                        <Fireflies count={bucket} reduced={reduced} />
                        {cell.sessions >= 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute -right-0.5 -top-1 rounded-full bg-bgDim px-1 text-[0.5rem] font-bold leading-tight text-ever-yellow"
                          >
                            {cell.sessions}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Selected-day detail — announced politely. */}
          <p
            className="min-h-[1.5rem] rounded-xl bg-bg2/50 px-3 py-2 text-center text-sm text-fg/90"
            aria-live="polite"
          >
            {selected ? detailLine(selected) : 'Pick a day to see how its evening glowed.'}
          </p>

          {/* Gentle insights */}
          {insights.length > 0 && (
            <ul className="space-y-1.5">
              {insights.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-fg/85">
                  <span aria-hidden="true">🌙</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 1–3 warm, original insights. All copy is fresh and in-file (no scripture, no
 * encouragement-library text). Never frames a gap as a broken streak.
 */
function buildInsights(log, garden, today) {
  const out = []

  // Welcome back after a gap (only when today is still quiet).
  if (activeWithin(log, today, 1) === 0) {
    const since = daysSinceActive(log, today)
    if (since >= 2 && since < 400) {
      out.push("Welcome back. The meadow's glad to see you. Light one firefly when you're ready.")
    }
  }

  // Recent consistency, framed by what's there (not what's missing).
  const recent = activeWithin(log, today, 7)
  if (recent > 0) {
    out.push(`You've tended your grove ${recent} of the last 7 days.`)
  }

  // Time-of-day lean, mirroring how the Grove reads before-noon / after-dark.
  if (garden.length >= 3) {
    const hours = garden.map((t) => hourOf(t.ts))
    const morning = hours.filter((h) => h < 12).length
    const evening = hours.filter((h) => h >= 18 || h < 5).length
    if (morning / hours.length >= 0.5) {
      out.push('Mornings glow brightest for you lately.')
    } else if (evening / hours.length >= 0.4) {
      out.push('Your fireflies favor the after-dark hours.')
    }
  }

  return out.slice(0, 3)
}

/** Days since the most recent active day before today (Infinity if none). */
function daysSinceActive(log, today) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let i = 1; i < 400; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const entry = log[`${y}-${m}-${day}`]
    if (entry && entry.sessions > 0) return i
  }
  return Infinity
}
