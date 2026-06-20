// Calendar-day helpers for streak / daily-stat bookkeeping. These use UTC
// (toISOString) to match the format the app already has in saved data.
//
// NOTE: flashcard *scheduling* deliberately uses LOCAL day boundaries instead
// (see `localDayStr`/`isDueToday` in src/data/scheduler.js) so "due today"
// matches the user's wall clock. These stat helpers stay UTC for back-compat.

/** Today as `YYYY-MM-DD` (UTC). */
export function dayStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/** Yesterday as `YYYY-MM-DD` (UTC). */
export function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayStr(d)
}
