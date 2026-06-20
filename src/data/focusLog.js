// Firefly Calendar time-series — the pure, deterministic layer behind the dusk-
// meadow consistency map. No I/O and no internal clock reads: callers pass `now`
// / `today` in so every function is trivially unit-testable.
//
// Days are bucketed by LOCAL calendar day (wall-clock), reusing the scheduler's
// `localDayStr` so the personal calendar matches what Emily actually sees on her
// clock — never UTC. (`utils/day.js` stays UTC for streak bookkeeping.)
//
// Shape of a focusLog: an object keyed by local "YYYY-MM-DD":
//   { "2026-06-18": { sessions: 3, minutes: 75 },
//     "2026-06-12": { sessions: 2, minutes: null } }  // backfilled: minutes unknown
// `minutes` is null for history reconstructed from the garden (we never fabricate
// precision); it becomes a real total once a live session lands on that day.

import { localDayStr } from './scheduler.js'

/** Local YYYY-MM-DD for a timestamp (ms) or Date. */
export function localYMD(tsOrDate) {
  const d = tsOrDate instanceof Date ? tsOrDate : new Date(tsOrDate)
  return localDayStr(d)
}

/** Local Date at midnight for a ymd string / ms / Date (DST-safe, calendar fields). */
function toLocalMidnight(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  if (typeof value === 'string') {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }
  const d = new Date(value)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Reconstruct a focusLog from the existing garden timestamps. Each `garden[].ts`
 * is one completed focus session, bucketed by local day. Minutes are unknown for
 * backfilled history, so they stay `null`. Pure and idempotent.
 * @param {{ts:number}[]} garden
 * @returns {Object<string,{sessions:number,minutes:null}>}
 */
export function backfillFromGarden(garden = []) {
  const log = {}
  for (const tree of garden) {
    if (!tree || tree.ts == null) continue
    const ymd = localYMD(tree.ts)
    if (!log[ymd]) log[ymd] = { sessions: 0, minutes: null }
    log[ymd].sessions += 1
  }
  return log
}

/**
 * Record one completed focus session, returning a NEW log (never mutates input).
 * The day's `sessions` grows by one and `minutes` accumulates the real focus
 * length; an existing `null` (backfilled) total is treated as 0 once a real
 * session lands so the day's minutes become precise from here on.
 * @param {Object} log
 * @param {{ts:number, minutes:number}} entry
 */
export function recordSession(log = {}, { ts, minutes } = {}) {
  const ymd = localYMD(ts)
  const prev = log[ymd] || { sessions: 0, minutes: null }
  const hasMinutes = Number.isFinite(minutes)
  const base = prev.minutes == null ? 0 : prev.minutes
  const nextMinutes = hasMinutes ? base + minutes : prev.minutes
  return { ...log, [ymd]: { sessions: prev.sessions + 1, minutes: nextMinutes } }
}

/**
 * Intensity bucket for a day's session count: 0, 1, 2, 3, or 4+ (capped at 4).
 * Drives both firefly count and glow strength.
 */
export function bucketFor(sessions = 0) {
  if (!sessions || sessions <= 0) return 0
  if (sessions >= 4) return 4
  return sessions
}

/**
 * Build the meadow grid: 7 weekday lanes (rows, Sun→Sat) × `weeks` columns
 * (oldest→newest, the last column holding today's week). Each cell is
 * `{ ymd, sessions, minutes, isToday, inFuture }`. Days after today are `inFuture`
 * and render inert. Pure — derives entirely from `log` and the passed `today`.
 * @returns {Array<Array<{ymd:string,sessions:number,minutes:number|null,isToday:boolean,inFuture:boolean}>>}
 */
export function lastNWeeks(log = {}, today = new Date(), weeks = 16) {
  const todayDate = toLocalMidnight(today)
  const todayYmd = localDayStr(todayDate)
  // Sunday that opens today's (rightmost) week column.
  const weekStart = new Date(todayDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  // Sunday that opens the oldest (leftmost) column.
  const gridStart = new Date(weekStart)
  gridStart.setDate(gridStart.getDate() - (weeks - 1) * 7)

  const rows = []
  for (let row = 0; row < 7; row++) {
    const lane = []
    for (let col = 0; col < weeks; col++) {
      const d = new Date(gridStart)
      d.setDate(d.getDate() + col * 7 + row)
      const ymd = localDayStr(d)
      const day = log[ymd] || null
      lane.push({
        ymd,
        sessions: day ? day.sessions : 0,
        minutes: day ? day.minutes : null,
        isToday: ymd === todayYmd,
        inFuture: d > todayDate,
      })
    }
    rows.push(lane)
  }
  return rows
}

/** How many of the last `days` local days (including today) had ≥1 session. */
export function activeWithin(log = {}, today = new Date(), days = 7) {
  const todayDate = toLocalMidnight(today)
  let active = 0
  for (let i = 0; i < days; i++) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    const day = log[localDayStr(d)]
    if (day && day.sessions > 0) active += 1
  }
  return active
}

/**
 * Top-line numbers for the calendar header. `currentStreak` is the streak value
 * PASSED IN (reused from the Focus Meter / emily.stats) — never recomputed here,
 * so the calendar can't diverge from the meter. `totalKnownMinutes` sums only the
 * days where minutes are known (non-null).
 */
export function summarize(log = {}, { streak = 0 } = {}) {
  let totalSessions = 0
  let totalKnownMinutes = 0
  let activeDays = 0
  let bestDay = null
  for (const [ymd, day] of Object.entries(log)) {
    const sessions = (day && day.sessions) || 0
    if (sessions <= 0) continue
    activeDays += 1
    totalSessions += sessions
    if (Number.isFinite(day.minutes)) totalKnownMinutes += day.minutes
    if (!bestDay || sessions > bestDay.sessions) {
      bestDay = { ymd, sessions, minutes: Number.isFinite(day.minutes) ? day.minutes : null }
    }
  }
  return { totalSessions, totalKnownMinutes, activeDays, bestDay, currentStreak: streak || 0 }
}
