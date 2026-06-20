// Forest Spirits — a small, finite catalogue of collectible companion creatures,
// drawn by the deterministic SpiritGenerator. Spirits are COMPANIONS, not
// achievements: they appear retroactively from study habits the app already
// records, the same sticky way the Grove Almanac unlocks varietals — so this reuses
// grove.js's derivation engine (progressFor + reconcile) rather than forking one.
//
// Derived sources (no new tracking required):
//   • grown / before-noon count / after-8pm count  ← emily.garden ([{id,ts}])
//   • streak       ← emily.stats.streak     • reviews ← emily.flashcardStats.total
//   • reflections  ← emily.reflections.length
//
// Persisted shape (emily.spirits):
//   { unlocked: { [id]: true }, seen: { [id]: true }, discoveredAt: { [id]: ts|null } }
// discoveredAt is the live discovery timestamp; it stays NULL for spirits seeded
// retroactively (we never fabricate a date — the UI shows "—").

import { reconcile, progressFor } from './grove.js'

const hourOf = (ts) => new Date(ts).getHours()

export const SPIRITS = [
  {
    id: 'curiosity',
    name: 'Curiosity',
    seed: 3,
    paletteKey: 'gold',
    blurb: 'The first to find you. It tags along with anyone who wonders what comes next.',
    rule: { metric: 'grown', n: 1 },
  },
  {
    id: 'dawn',
    name: 'Dawn',
    seed: 1,
    paletteKey: 'rose',
    blurb: 'A soft early riser. It loves the quiet, slanting light of the morning.',
    rule: { metric: 'beforeNoonCount', n: 10 },
  },
  {
    id: 'nightOwl',
    name: 'Night Owl',
    seed: 8,
    paletteKey: 'blue',
    blurb: 'Wide awake when the house is asleep. It keeps the late watch alongside you.',
    rule: { metric: 'after8pmCount', n: 10 },
  },
  {
    id: 'persistence',
    name: 'Persistence',
    seed: 4,
    paletteKey: 'green',
    blurb: 'Small, stubborn, and quietly proud of you. It shows up exactly the way you do.',
    rule: { metric: 'streak', n: 7 },
  },
  {
    id: 'reflection',
    name: 'Reflection',
    seed: 11,
    paletteKey: 'aqua',
    blurb: 'Still and listening. It gathers up the things you pause to write down.',
    rule: { metric: 'reflections', n: 20 },
  },
  {
    id: 'scholar',
    name: 'Scholar',
    seed: 14,
    paletteKey: 'purple',
    blurb: 'Patient and round-eyed. It keeps a tally of every card you ever bring back.',
    rule: { metric: 'reviews', n: 200 },
  },
]

export const SPIRITS_BY_ID = Object.fromEntries(SPIRITS.map((s) => [s.id, s]))

/** Derive spirit unlock metrics from the existing stores (counts, not booleans). */
export function spiritMetrics({ garden = [], stats = {}, flashcardStats = {}, reflections = [] } = {}) {
  let beforeNoonCount = 0
  let after8pmCount = 0
  for (const t of garden) {
    const h = hourOf(t.ts)
    if (h < 12) beforeNoonCount += 1
    // "After 8pm" includes the late-night/early-morning tail (8pm–4:59am local),
    // matching the Grove's after-dark lower bound.
    if (h >= 20 || h < 5) after8pmCount += 1
  }
  return {
    grown: garden.length,
    beforeNoonCount,
    after8pmCount,
    streak: stats?.streak || 0,
    reflections: reflections?.length || 0,
    reviews: flashcardStats?.total || 0,
  }
}

/** Live progress toward a spirit's unlock, as { current, target, done } (reuses grove). */
export function progressForSpirit(spirit, metrics) {
  return progressFor(spirit, metrics)
}

/** A short, warm unlock hint. */
export function hintForSpirit(spirit) {
  const r = spirit.rule
  switch (r.metric) {
    case 'grown':
      return 'Appears with your very first focus session'
    case 'beforeNoonCount':
      return `Appears after ${r.n} focus sessions before noon`
    case 'after8pmCount':
      return `Appears after ${r.n} late sessions (after 8pm)`
    case 'streak':
      return `Appears at a ${r.n}-day streak`
    case 'reflections':
      return `Appears after ${r.n} reflections`
    case 'reviews':
      return `Appears after ${r.n} flashcard reviews`
    default:
      return 'Keep studying to meet this one'
  }
}

export function isUnlocked(spirit, spirits) {
  return !!spirits?.unlocked?.[spirit.id]
}

export function unlockedCount(spirits) {
  return Object.keys(spirits?.unlocked || {}).length
}

const EMPTY = { unlocked: {}, seen: {}, discoveredAt: {} }

/**
 * Reconcile sticky spirit unlocks against live metrics, reusing grove's engine.
 * Newly-discovered spirits get `discoveredAt = nowTs`; pass `nowTs = null` for the
 * retroactive seed (no fabricated dates). Sticky + non-destructive: never re-locks,
 * never overwrites an existing discovery date or `seen` flag. Pure.
 * @returns {{ state: {unlocked,seen,discoveredAt}, newlyUnlocked: object[] }}
 */
export function reconcileSpirits(state = EMPTY, metrics, nowTs = null) {
  const prior = { unlocked: { ...(state?.unlocked || {}) } }
  // `today = true` stamps unlocked[id] = true (we track the date in discoveredAt).
  const { grove, newlyUnlocked } = reconcile(prior, metrics, true, SPIRITS)
  const discoveredAt = { ...(state?.discoveredAt || {}) }
  for (const sp of newlyUnlocked) {
    if (!(sp.id in discoveredAt)) discoveredAt[sp.id] = nowTs
  }
  return {
    state: { unlocked: grove.unlocked, seen: { ...(state?.seen || {}) }, discoveredAt },
    newlyUnlocked,
  }
}
