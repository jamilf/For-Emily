// Part-of-day helper for the living background and time-aware greetings. Pure and
// deterministic from the LOCAL hour, so the dashboard's light and the sprite's words
// follow Emily's own clock. Boundaries are single constants here for easy tuning.

/** Local-hour boundaries (inclusive lower bound). dawn 5–7, day 8–16, dusk 17–19, night 20–4. */
export const DAWN_START = 5
export const DAY_START = 8
export const DUSK_START = 17
export const NIGHT_START = 20

/**
 * Map a moment to a part of day.
 * @param {Date} date
 * @returns {'dawn'|'day'|'dusk'|'night'}
 */
export function timeOfDay(date = new Date()) {
  const h = date.getHours()
  if (h >= DAWN_START && h < DAY_START) return 'dawn'
  if (h >= DAY_START && h < DUSK_START) return 'day'
  if (h >= DUSK_START && h < NIGHT_START) return 'dusk'
  return 'night'
}
