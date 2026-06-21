// Focus Quest Board — a few lightweight daily objectives that CANNOT be failed.
// Fully DERIVED: the day's set is deterministic from the LOCAL date, and completion
// is computed LIVE from today's metrics. Nothing is persisted, nothing expires, there
// is no fail/red state and no currency — finishing a quest just means the underlying
// study metrics advanced (the same metrics that feed Spirits / Constellations).

import { localDayStr } from './scheduler.js'
import { dayStr } from '../utils/day.js'
import { progressFor } from './grove.js'

export const DAILY_QUEST_COUNT = 3

// Distinct-metric templates (original copy). Numeric ones pick a target from `targets`;
// the rest are boolean (no `n`). `metric` keys match questMetricsToday() below.
export const QUEST_POOL = [
  {
    id: 'grow-trees',
    metric: 'treesToday',
    icon: '🌱',
    targets: [2, 3],
    verb: (n) => `Grow ${n} trees today`,
    hint: 'Each finished focus session grows one.',
  },
  {
    id: 'review-cards',
    metric: 'reviewsToday',
    icon: '🃏',
    targets: [10, 15, 20],
    verb: (n) => `Review ${n} cards today`,
    hint: 'Flashcards count up as you go.',
  },
  {
    id: 'reflect',
    metric: 'reflectionToday',
    icon: '🌤️',
    verb: () => 'Write one reflection today',
    hint: 'A quick mood check after a session.',
  },
  {
    id: 'morning-start',
    metric: 'beforeNoonToday',
    icon: '🌅',
    verb: () => 'Begin a session before noon',
    hint: 'An early start, gold at the edges.',
  },
  {
    id: 'after-dark',
    metric: 'nightToday',
    icon: '🌙',
    verb: () => 'Study after dark today',
    hint: 'For the quiet, late-watch kind of focus.',
  },
]

// Tiny seeded PRNG (same family the generators use) for a stable per-day shuffle.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// FNV-1a hash of the date string → a stable 32-bit seed.
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * The deterministic quest set for a LOCAL date string ('YYYY-MM-DD'). Same date →
 * identical quests; different dates differ. Pure.
 * @returns {Array<{id,icon,label,hint,rule:{metric:string,n?:number}}>}
 */
export function dailyQuests(dateStr = localDayStr()) {
  const rng = mulberry32(hashStr(String(dateStr)))
  const pool = QUEST_POOL.slice()
  // Fisher–Yates with the seeded rng.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, DAILY_QUEST_COUNT).map((t) => {
    const n = t.targets ? t.targets[Math.floor(rng() * t.targets.length)] : null
    return {
      id: t.id,
      icon: t.icon,
      hint: t.hint,
      label: t.verb(n),
      rule: n != null ? { metric: t.metric, n } : { metric: t.metric },
    }
  })
}

const hourOf = (ts) => new Date(ts).getHours()

/**
 * Live "today" metrics derived from existing stores. Trees/reflection/time-of-day use
 * the LOCAL day; flashcard reviews use the UTC day the stats were stamped with. Pure —
 * `now` is passed in so there is no hidden clock read.
 */
export function questMetricsToday(
  { garden = [], flashcardStats = {}, reflections = [] } = {},
  now = new Date(),
) {
  const localToday = localDayStr(now)
  const utcToday = dayStr(now)
  const isToday = (ts) => localDayStr(new Date(ts)) === localToday

  const todaysTrees = garden.filter((t) => t && t.ts != null && isToday(t.ts))
  const reviewsToday = flashcardStats.day === utcToday ? flashcardStats.reviewedToday || 0 : 0

  return {
    treesToday: todaysTrees.length,
    reviewsToday,
    reflectionToday: reflections.some((r) => r && r.ts != null && isToday(r.ts)),
    beforeNoonToday: todaysTrees.some((t) => hourOf(t.ts) < 12),
    nightToday: todaysTrees.some((t) => {
      const h = hourOf(t.ts)
      return h >= 20 || h < 5
    }),
  }
}

/** Evaluate each quest against live metrics (reuses grove's generic evaluator). */
export function evaluateQuests(quests, metrics) {
  return quests.map((q) => ({ ...q, ...progressFor(q, metrics) }))
}

/** Tally of completed quests. */
export function questSummary(evaluated) {
  return { done: evaluated.filter((q) => q.done).length, total: evaluated.length }
}
