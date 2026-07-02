// sessionBloom — the pure accretion curve behind the Grove Window's session arc.
// As a focus session runs, the scene calmly comes alive: fireflies gather one by
// one, the light warms, the flora perks at each of the tree's growth milestones,
// and the true final minute turns golden so completion reads as a harvest. Pure and
// injected (fraction + duration in, facts out): no clocks, no I/O, nothing stored.
// Growth thresholds are imported from treeGrowth so the tree and the scene move as
// one system.

import { SPROUT_AT, SAPLING_AT, MATURE_AT } from './treeGrowth.js'

export const FIREFLY_CAP = 12

const clamp01 = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0)

/** Where the golden minute begins: the FINAL 60 seconds, computed from the real
 * session length (never a fixed fraction), and never before the tree matures. */
export function goldenStart(durationSec = 1500) {
  if (!Number.isFinite(durationSec) || durationSec <= 120) return MATURE_AT
  return Math.max(MATURE_AT, 1 - 60 / durationSec)
}

/**
 * The scene's accretion state for a session-progress fraction.
 * @param {number} fraction  0..1 active-time progress (clamped)
 * @param {{durationSec?: number}} [opts]
 * @returns {{ phase:'settling'|'growing'|'golden'|'done',
 *   fireflies:number, lightWarmth:number, floraPerk:number }}
 */
export function bloom(fraction, { durationSec = 1500 } = {}) {
  const f = clamp01(fraction)
  const golden = goldenStart(durationSec)

  let phase
  if (f >= 1) phase = 'done'
  else if (f >= golden) phase = 'golden'
  else if (f >= SPROUT_AT) phase = 'growing'
  else phase = 'settling'

  // Fireflies gather one by one across the whole session and hold at the cap
  // (monotonic non-decreasing: nothing earned within a session ever leaves).
  const fireflies = Math.min(FIREFLY_CAP, Math.floor(f * (FIREFLY_CAP + 1)))

  // Light warms on a gentle ease-in and blooms fully golden for the last stretch.
  const lightWarmth = phase === 'golden' || phase === 'done' ? 1 : Math.min(1, f * f * 1.1)

  // Flora perks a small step at each tree milestone (same thresholds as growth).
  const floraPerk = f >= MATURE_AT ? 1 : f >= SAPLING_AT ? 0.67 : f >= SPROUT_AT ? 0.34 : 0

  return { phase, fireflies, lightWarmth, floraPerk }
}

// Warm, original, em-dash-free lines for the ONE consolidated live region. Only
// phase changes are announced, never per-firefly or per-second chatter.
const LABELS = {
  settling: 'The grove settles in with you.',
  growing: 'Fireflies are starting to gather.',
  golden: 'The last stretch glows gold.',
  done: 'The grove is glad you stayed.',
}

/**
 * @param {'settling'|'growing'|'golden'|'done'} phase
 * @returns {string}
 */
export function bloomLabel(phase) {
  return LABELS[phase] || LABELS.settling
}
