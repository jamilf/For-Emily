// "Your week in the grove" — a pure, derived weekly review. No I/O and no internal
// clock reads: callers pass `today` and the source data in, so every function is
// trivially unit-testable. Reuses the same local-calendar bucketing as focusLog
// (local wall-clock days, Sunday-opening weeks) so this matches what Emily sees on
// her own clock, never UTC.

import { localYMD } from './focusLog.js'

// Local midnight Date for a Date or ms timestamp (DST-safe; uses calendar fields).
function localMidnight(value) {
  const d = value instanceof Date ? value : new Date(value)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** The Sunday (local midnight) that opens the week containing `date`. */
export function weekStart(date = new Date()) {
  const d = localMidnight(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

// Sum a focusLog over the 7 local days starting at `start` (a Sunday midnight).
// `minutes` adds only known (non-null) day totals, never fabricating precision.
function sumWeek(log, start) {
  let sessions = 0
  let minutes = 0
  let activeDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const day = log[localYMD(d)]
    const s = (day && day.sessions) || 0
    if (s <= 0) continue
    activeDays += 1
    sessions += s
    if (Number.isFinite(day.minutes)) minutes += day.minutes
  }
  return { sessions, minutes, activeDays }
}

// Part-of-day by local hour. Ranges chosen to match the cozy feel of each window.
const PARTS = ['morning', 'afternoon', 'evening', 'night']
function partOfDay(hour) {
  if (hour >= 5 && hour <= 11) return 'morning'
  if (hour >= 12 && hour <= 16) return 'afternoon'
  if (hour >= 17 && hour <= 20) return 'evening'
  return 'night' // 21–23 and 0–4
}

/**
 * The part of day Emily most often finishes a session, from garden timestamps.
 * Ties resolve to the earlier part of day (PARTS order). Null when no sessions.
 */
export function bestPartOfDay(garden = []) {
  const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  let any = false
  for (const tree of garden) {
    if (!tree || tree.ts == null) continue
    any = true
    counts[partOfDay(new Date(tree.ts).getHours())] += 1
  }
  if (!any) return null
  let best = PARTS[0]
  for (const p of PARTS) {
    if (counts[p] > counts[best]) best = p
  }
  return best
}

/**
 * The whole weekly review, derived from existing data (no new persistence).
 * @param {Object} log  emily.focusLog
 * @param {{today?:Date, garden?:Array, reflections?:Array, streak?:number, recentLimit?:number}} opts
 * @returns {{thisWeek:{sessions:number,minutes:number,activeDays:number},
 *   lastWeek:{sessions:number,minutes:number,activeDays:number},
 *   trend:'first'|'up'|'steady'|'down', bestPartOfDay:string|null,
 *   recentReflections:Array<{ts:number,mood:string,note:string}>, streak:number}}
 */
export function weekReview(
  log = {},
  { today = new Date(), garden = [], reflections = [], streak = 0, recentLimit = 5 } = {},
) {
  const thisStart = weekStart(today)
  const lastStart = new Date(thisStart)
  lastStart.setDate(lastStart.getDate() - 7)

  const thisWeek = sumWeek(log, thisStart)
  const lastWeek = sumWeek(log, lastStart)

  // Trend by session count. 'first' when there is no prior-week activity to
  // compare against, so the copy can celebrate a beginning rather than a delta.
  let trend
  if (lastWeek.sessions === 0) trend = 'first'
  else if (thisWeek.sessions > lastWeek.sessions) trend = 'up'
  else if (thisWeek.sessions < lastWeek.sessions) trend = 'down'
  else trend = 'steady'

  const recentReflections = reflections
    .filter((r) => r && r.ts != null)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, recentLimit)

  return {
    thisWeek,
    lastWeek,
    trend,
    bestPartOfDay: bestPartOfDay(garden),
    recentReflections,
    streak: streak || 0,
  }
}
