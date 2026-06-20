// Grove Almanac — a finite, named catalogue of tree varietals built from the
// real procedural generator (src/pixel/PlantGenerator.js), plus the unlock model.
//
// The generator is already deterministic: a tree's `dna` decodes as
//   shape(4) × trunk(3) × pattern(3) × palette(5)  →  dna = shape + trunk*4 + pattern*12 + palette*36
// so each species below is just a fixed preset. Unlocks are derived ENTIRELY from
// data the app already stores (no invasive new tracking):
//   • grown / lifetime minutes / before-noon / after-dark  ← emily.garden ([{id,ts}])
//   • streak    ← emily.stats.streak        • reviews ← emily.flashcardStats.total
//   • reflections ← emily.reflections.length
// Unlocks are STICKY: once earned they persist (so a reset streak never re-locks).

import { dayStr } from '../utils/day.js'

const MINUTES_PER_SESSION = 25 // one harvested tree == one finished 25-min session

// Palette / shape indices mirror PlantGenerator (kept in sync intentionally).
// palette: 0 forest · 1 autumn · 2 blossom-pink · 3 teal · 4 golden
// shape:   0 round · 1 pine · 2 tall-oval · 3 broad
export function dnaOf({ shape = 0, trunk = 0, pattern = 0, palette = 0 }) {
  return shape + trunk * 4 + pattern * 12 + palette * 36
}

// The catalogue. Names + flavor are original and warm; each maps to a real preset
// and one unlock rule tied to an existing metric. `mystery` hides the hint.
export const SPECIES = [
  {
    id: 'first-sprout',
    name: 'First Sprout',
    category: 'sprout',
    shape: 0,
    palette: 0,
    stage: 'sprout',
    rule: { metric: 'grown', n: 1 },
    flavor: 'Every grove starts as a single sprout.',
  },
  {
    id: 'quiet-pine',
    name: 'Quiet Pine',
    category: 'evergreen',
    shape: 1,
    palette: 0,
    rule: { metric: 'grown', n: 2 },
    flavor: 'Steady and green, in no hurry.',
  },
  {
    id: 'lucky-sapling',
    name: 'Lucky Sapling',
    category: 'greens',
    shape: 0,
    palette: 0,
    stage: 'sapling',
    rule: { metric: 'grown', n: 4 },
    flavor: 'Small things, growing surely.',
  },
  {
    id: 'dawn-canopy',
    name: 'Dawn Canopy',
    category: 'warm',
    shape: 3,
    palette: 4,
    rule: { metric: 'beforeNoon' },
    flavor: 'An early start, gold at the edges.',
  },
  {
    id: 'sunfacer-oak',
    name: 'Sunfacer Oak',
    category: 'warm',
    shape: 2,
    palette: 4,
    rule: { metric: 'grown', n: 6 },
    flavor: 'Turns toward the light, the way you turn toward rest.',
  },
  {
    id: 'soft-blossom',
    name: 'Soft Blossom',
    category: 'blossom',
    shape: 0,
    palette: 2,
    rule: { metric: 'minutes', n: 75 },
    flavor: 'Patience, then petals.',
  },
  {
    id: 'steady-birch',
    name: 'Steady Birch',
    category: 'greens',
    shape: 2,
    palette: 0,
    rule: { metric: 'streak', n: 3 },
    flavor: 'Three days running — look at you.',
  },
  {
    id: 'night-cedar',
    name: 'Night Cedar',
    category: 'dusk',
    shape: 1,
    palette: 3,
    rule: { metric: 'afterDark' },
    flavor: 'For the quiet, after-dark kind of focus.',
  },
  {
    id: 'meadow-crown',
    name: 'Meadow Crown',
    category: 'wild',
    shape: 3,
    palette: 0,
    rule: { metric: 'grown', n: 15 },
    flavor: "A whole meadow's worth.",
  },
  {
    id: 'brave-maple',
    name: 'Brave Maple',
    category: 'layered',
    shape: 3,
    palette: 1,
    rule: { metric: 'grown', n: 10 },
    flavor: 'Bold colour, earned slowly.',
  },
  {
    id: 'stillwater-willow',
    name: 'Still-Water Willow',
    category: 'calm',
    shape: 2,
    palette: 3,
    rule: { metric: 'reflections', n: 1 },
    flavor: 'Blooms best from still water.',
  },
  {
    id: 'scholars-grove',
    name: "Scholar's Grove",
    category: 'cluster',
    shape: 0,
    palette: 2,
    rule: { metric: 'reviews', n: 20 },
    flavor: 'Every card recalled, a little leaf.',
  },
  {
    id: 'lavender-hush',
    name: 'Lavender Hush',
    category: 'wild',
    shape: 1,
    palette: 2,
    rule: { metric: 'minutes', n: 150 },
    flavor: 'Soft, low, and calming.',
  },
  {
    id: 'goldenhour-elm',
    name: 'Golden-Hour Elm',
    category: 'warm',
    shape: 3,
    palette: 4,
    trunk: 2,
    rule: { metric: 'streak', n: 5 },
    flavor: 'Five days; the light goes gold.',
  },
  {
    id: 'cherry-whisper',
    name: 'Cherry Whisper',
    category: 'blossom',
    shape: 0,
    palette: 1,
    rule: { metric: 'grown', n: 20 },
    flavor: 'Soft and quietly proud.',
  },
  {
    id: 'deeproots-oak',
    name: 'Deep-Roots Oak',
    category: 'tree',
    shape: 2,
    palette: 1,
    trunk: 2,
    rule: { metric: 'streak', n: 7 },
    flavor: 'Deep roots, patient crown.',
  },
  {
    id: 'glasswing-aspen',
    name: 'Glasswing Aspen',
    category: 'rare',
    shape: 2,
    palette: 3,
    pattern: 2,
    rule: { metric: 'minutes', n: 200 },
    flavor: 'Rare and luminous — you earned the shimmer.',
  },
  {
    id: 'aurora-larch',
    name: 'Aurora Larch',
    category: 'rare',
    shape: 1,
    palette: 4,
    rule: { metric: 'streak', n: 14 },
    flavor: 'Two weeks of showing up. Extraordinary.',
  },
  {
    id: 'evergreen-crown',
    name: 'Evergreen Crown',
    category: 'rare',
    shape: 3,
    palette: 3,
    trunk: 2,
    rule: { metric: 'grown', n: 40 },
    flavor: 'The long-haul grove.',
  },
  {
    id: 'hidden-star',
    name: 'Hidden Star',
    category: 'secret',
    shape: 0,
    palette: 4,
    pattern: 2,
    trunk: 1,
    rule: { metric: 'grown', n: 30 },
    mystery: true,
    flavor: 'Some things bloom when you least expect them.',
  },
]

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]))

const hourOf = (ts) => new Date(ts).getHours()

/** Derive unlock metrics from the existing stores. */
export function groveMetrics({ garden = [], stats = {}, flashcardStats = {}, reflections = [] } = {}) {
  return {
    grown: garden.length,
    minutes: garden.length * MINUTES_PER_SESSION,
    streak: stats?.streak || 0,
    reviews: flashcardStats?.total || 0,
    reflections: reflections?.length || 0,
    beforeNoon: garden.some((t) => hourOf(t.ts) < 12),
    afterDark: garden.some((t) => hourOf(t.ts) >= 18 || hourOf(t.ts) < 5),
  }
}

const numProgress = (cur, target) => ({ current: Math.min(cur, target), target, done: cur >= target })
const boolProgress = (b) => ({ current: b ? 1 : 0, target: 1, done: !!b })

/**
 * Live progress toward an item's unlock, as { current, target, done }.
 * Catalogue-agnostic: a rule with a numeric `n` reads `metrics[rule.metric]` as a
 * count; a rule without `n` reads it as a boolean. This same evaluator drives both
 * the Grove varietals and the Forest Spirits (which add count metrics) — one engine.
 */
export function progressFor(species, metrics) {
  const r = species.rule
  const value = metrics[r.metric]
  return r.n != null ? numProgress(value || 0, r.n) : boolProgress(value)
}

/** A short, kind unlock hint (hidden for mystery species). */
export function hintFor(species) {
  if (species.mystery) return 'A mystery seed — keep going.'
  const r = species.rule
  switch (r.metric) {
    case 'grown':
      return `Grows after ${r.n} focus session${r.n === 1 ? '' : 's'}`
    case 'minutes':
      return `Grows after ${r.n} focused minutes`
    case 'streak':
      return `Grows at a ${r.n}-day streak`
    case 'reviews':
      return `Grows after ${r.n} flashcard reviews`
    case 'reflections':
      return 'Grows after a reflection'
    case 'beforeNoon':
      return 'Grows from a session before noon'
    case 'afterDark':
      return 'Grows from a session after dark'
    default:
      return 'Keep going to discover this one'
  }
}

/** How many times a catalogued species has actually been grown (from the garden). */
export function timesGrown(species, garden = []) {
  const dna = dnaOf(species)
  return garden.filter((t) => t.id === dna).length
}

export function isUnlocked(species, grove) {
  return !!grove?.unlocked?.[species.id]
}

export function unlockedCount(grove) {
  return Object.keys(grove?.unlocked || {}).length
}

/**
 * Reconcile sticky unlock state against live metrics. Adds any newly-earned
 * item (stamped with `today`) without ever removing one. Pure. The catalogue is
 * pluggable so the Forest Spirits can reuse this exact sticky+retroactive engine.
 * @returns {{ grove: {unlocked: Object, plantNext: number|null}, newlyUnlocked: object[] }}
 */
export function reconcile(grove, metrics, today = dayStr(), catalogue = SPECIES) {
  const unlocked = { ...(grove?.unlocked || {}) }
  const newlyUnlocked = []
  for (const species of catalogue) {
    if (unlocked[species.id]) continue
    if (progressFor(species, metrics).done) {
      unlocked[species.id] = today
      newlyUnlocked.push(species)
    }
  }
  return { grove: { unlocked, plantNext: grove?.plantNext ?? null }, newlyUnlocked }
}

/** A dna to grow next, drawn from unlocked species (newest-first bias). Null if none. */
export function pickPlantableDna(grove) {
  const ids = Object.keys(grove?.unlocked || {})
  if (ids.length === 0) return null
  const id = ids[Math.floor(Math.random() * ids.length)]
  return SPECIES_BY_ID[id] ? dnaOf(SPECIES_BY_ID[id]) : null
}

/** The nearest-to-unlocking locked species (best progress ratio), for the "next bloom". */
export function nextBloom(grove, metrics) {
  let best = null
  let bestRatio = -1
  for (const species of SPECIES) {
    if (isUnlocked(species, grove)) continue
    const p = progressFor(species, metrics)
    if (p.done) continue // earned but not yet reconciled — not a "next" goal
    const ratio = p.target ? p.current / p.target : 0
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = species
    }
  }
  return best
}
