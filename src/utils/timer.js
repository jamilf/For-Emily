// Pure timer math. The Pomodoro derives its remaining time from a wall-clock
// deadline (`endsAt`) rather than counting down a mutable integer, so a tab that
// gets throttled or backgrounded can't desync the clock — when it wakes, the
// remaining time is recomputed from Date.now().

/**
 * Wall-clock deadline for a countdown with `secondsLeft` remaining, starting now.
 * @param {number} secondsLeft
 * @param {number} [now]
 * @returns {number} epoch ms when the countdown hits zero
 */
export function endsAtFrom(secondsLeft, now = Date.now()) {
  return now + secondsLeft * 1000
}

/**
 * Seconds remaining until `endsAt`, clamped at zero. Returns null when no
 * countdown is active (paused/idle), so callers can tell "stopped" from "0:00".
 * @param {number|null|undefined} endsAt
 * @param {number} [now]
 * @returns {number|null}
 */
export function remainingSeconds(endsAt, now = Date.now()) {
  if (endsAt == null) return null
  return Math.max(0, Math.round((endsAt - now) / 1000))
}

/**
 * Format a non-negative seconds count as MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
export function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
