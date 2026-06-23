// Pure context → mood mapping for the music engine's Auto mode. Deterministic and
// unit-testable; returns one of the chiptune mood ids. Rules are gentle and
// predictable so Auto never lurches between very different feels.

export const AUTO_MOOD_IDS = ['latenight', 'rainyfocus', 'momentum', 'winddown']

/**
 * Pick a warm mood from the current context:
 * - a meaningfully raised rain setting → Rainy Focus (cozy, leans into the rain)
 * - the small hours (0–4) → Winding Down (softest, slowest)
 * - late evening (21–23) → Late-night Library
 * - an active focus session → stay calm with Late-night Library
 * - otherwise (daytime) → Last-minute Momentum (a touch more pulse, never anxious)
 * @param {{ hour?: number, rainLevel?: number, focusActive?: boolean }} ctx
 * @returns {string} a chiptune mood id
 */
export function pickAutoMood({ hour = 12, rainLevel = 0, focusActive = false } = {}) {
  const h = ((Math.floor(hour) % 24) + 24) % 24
  if (rainLevel >= 0.35) return 'rainyfocus'
  if (h < 5) return 'winddown'
  if (h >= 21) return 'latenight'
  if (focusActive) return 'latenight'
  return 'momentum'
}
