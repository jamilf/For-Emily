// Pure growth logic for the focus session's tree: which DNA this session grows, the
// stage it has reached by progress, and the kind words announced on each change. No
// I/O and no clock reads (the caller injects the start time and progress), so it is
// deterministic and unit-testable. The art itself stays in PlantGenerator.

import { STAGES, dnaFromSeed } from '../pixel/PlantGenerator.js'

/**
 * The DNA for this session's tree. A varietal queued from the Almanac wins; else it
 * is derived deterministically from the session's start time, so the same tree she
 * watched grow is the one that harvests.
 * @param {{ startTs?: number, plantNext?: number|null }} ctx
 * @returns {number} a valid PlantGenerator DNA
 */
export function sessionSeed({ startTs, plantNext } = {}) {
  if (Number.isFinite(plantNext)) return plantNext
  return dnaFromSeed(Number.isFinite(startTs) ? startTs : 0)
}

// Stage thresholds tuned so the final stretch shows a full, thriving tree: mature is
// reached at 0.90, before completion, so finishing reads as a harvest rather than the
// moment it matures.
const SPROUT_AT = 0.3
const SAPLING_AT = 0.62
const MATURE_AT = 0.9

/**
 * Growth stage index (0..3 over STAGES) for a focus-progress fraction. Clamps
 * gracefully: NaN or below 0 stays a seed, at or above 1 is mature.
 * @param {number} fraction
 * @returns {number} 0 seed | 1 sprout | 2 sapling | 3 mature
 */
export function growthStageForProgress(fraction) {
  if (!Number.isFinite(fraction) || fraction < SPROUT_AT) return 0
  if (fraction >= MATURE_AT) return 3
  if (fraction >= SAPLING_AT) return 2
  return 1
}

// Warm, original, em-dash-free copy for the visually-hidden live region.
const LABELS = {
  seed: 'A seed, tucked into the soil.',
  sprout: 'A sprout, unfurling.',
  sapling: 'A sapling, reaching up.',
  mature: 'A tree, grown full and green.',
}

/**
 * Kind announcement for a growth stage, given either its index or its name.
 * @param {number|string} stage
 * @returns {string}
 */
export function growthLabel(stage) {
  const name = typeof stage === 'number' ? STAGES[stage] : stage
  return LABELS[name] || LABELS.seed
}
