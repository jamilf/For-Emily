// Constellations — a DERIVED night-sky view of progress. It owns no state: each
// named constellation lights its stars as Emily accumulates study. No persistence,
// no sync, no migration — it only reads existing stores, reusing the Grove's
// `progressFor` evaluator so there's one derivation engine.
//
// Every metric here is CUMULATIVE / non-decreasing (sessions, days, reviews, …), so a
// constellation only ever lights up more — it never dims. Gentle by design.

import { progressFor } from './grove.js'

const hourOf = (ts) => new Date(ts).getHours()

// Star shapes are authored relative coords (0..1) within each constellation's cell;
// the component places the cell on the sky. Original names + warm blurbs.
export const CONSTELLATIONS = [
  {
    id: 'first-spark',
    name: 'The First Spark',
    blurb: 'Where every grove begins — your very first session.',
    rule: { metric: 'sessions', n: 1 },
    stars: [
      { x: 0.2, y: 0.7 },
      { x: 0.5, y: 0.3 },
      { x: 0.8, y: 0.6 },
    ],
  },
  {
    id: 'lantern',
    name: 'The Lantern',
    blurb: 'A steady light you carry — ten sessions in.',
    rule: { metric: 'sessions', n: 10 },
    stars: [
      { x: 0.35, y: 0.15 },
      { x: 0.65, y: 0.15 },
      { x: 0.7, y: 0.55 },
      { x: 0.5, y: 0.85 },
      { x: 0.3, y: 0.55 },
    ],
  },
  {
    id: 'long-path',
    name: 'The Long Path',
    blurb: 'Seven days of showing up, one star each.',
    rule: { metric: 'days', n: 7 },
    stars: [
      { x: 0.15, y: 0.75 },
      { x: 0.38, y: 0.55 },
      { x: 0.6, y: 0.4 },
      { x: 0.85, y: 0.2 },
    ],
  },
  {
    id: 'early-lark',
    name: 'The Early Lark',
    blurb: 'For the mornings you began before noon.',
    rule: { metric: 'mornings', n: 5 },
    stars: [
      { x: 0.2, y: 0.6 },
      { x: 0.45, y: 0.35 },
      { x: 0.7, y: 0.3 },
      { x: 0.85, y: 0.55 },
    ],
  },
  {
    id: 'night-heron',
    name: 'The Night Heron',
    blurb: 'For the quiet, after-dark kind of focus.',
    rule: { metric: 'nights', n: 5 },
    stars: [
      { x: 0.25, y: 0.25 },
      { x: 0.4, y: 0.5 },
      { x: 0.55, y: 0.7 },
      { x: 0.78, y: 0.78 },
    ],
  },
  {
    id: 'scholars-crown',
    name: "The Scholar's Crown",
    blurb: 'A hundred cards recalled, each a small light.',
    rule: { metric: 'reviews', n: 100 },
    stars: [
      { x: 0.15, y: 0.6 },
      { x: 0.32, y: 0.3 },
      { x: 0.5, y: 0.18 },
      { x: 0.68, y: 0.3 },
      { x: 0.85, y: 0.6 },
      { x: 0.5, y: 0.5 },
    ],
  },
  {
    id: 'keepsake',
    name: 'The Keepsake',
    blurb: 'Three trees you chose to remember forever.',
    rule: { metric: 'memories', n: 3 },
    stars: [
      { x: 0.3, y: 0.35 },
      { x: 0.7, y: 0.35 },
      { x: 0.5, y: 0.75 },
    ],
  },
  {
    id: 'companions',
    name: 'The Companions',
    blurb: 'The forest spirits that have found you.',
    rule: { metric: 'spirits', n: 3 },
    stars: [
      { x: 0.2, y: 0.4 },
      { x: 0.4, y: 0.25 },
      { x: 0.6, y: 0.25 },
      { x: 0.8, y: 0.4 },
      { x: 0.5, y: 0.7 },
    ],
  },
  {
    id: 'still-pool',
    name: 'The Still Pool',
    blurb: 'Five times you paused to reflect.',
    rule: { metric: 'reflections', n: 5 },
    stars: [
      { x: 0.25, y: 0.45 },
      { x: 0.5, y: 0.3 },
      { x: 0.75, y: 0.45 },
      { x: 0.5, y: 0.65 },
    ],
  },
]

/** Derive the cumulative metrics that light the constellations from existing stores. */
export function constellationMetrics({
  garden = [],
  focusLog = {},
  flashcardStats = {},
  reflections = [],
  memories = [],
  spirits = {},
} = {}) {
  let mornings = 0
  let nights = 0
  for (const t of garden) {
    if (!t || t.ts == null) continue
    const h = hourOf(t.ts)
    if (h < 12) mornings += 1
    if (h >= 20 || h < 5) nights += 1
  }
  const days = Object.values(focusLog).filter((d) => d && d.sessions > 0).length
  return {
    sessions: garden.length,
    days,
    mornings,
    nights,
    reviews: flashcardStats?.total || 0,
    reflections: reflections.length,
    memories: memories.length,
    spirits: Object.keys(spirits.unlocked || {}).length,
  }
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

/**
 * Resolve each constellation against live metrics.
 * @returns {Array<{id,name,blurb,stars,rule,progress,litStars,formed}>}
 */
export function buildSky(metrics) {
  return CONSTELLATIONS.map((c) => {
    const progress = progressFor(c, metrics)
    const ratio = progress.target ? progress.current / progress.target : 0
    const litStars = clamp(Math.round(ratio * c.stars.length), 0, c.stars.length)
    return { ...c, progress, litStars, formed: progress.done }
  })
}
