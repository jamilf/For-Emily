import { describe, it, expect } from 'vitest'
import { weekReview, weekStart, bestPartOfDay } from './weekReview.js'
import { localYMD } from './focusLog.js'

// A fixed Wednesday so the week math is deterministic. June 17 2026 is a Wednesday;
// its week opens on Sunday June 14, and the prior week opens on Sunday June 7.
const TODAY = new Date(2026, 5, 17)
const key = (y, m, d) => localYMD(new Date(y, m, d))
// A timestamp at a specific local hour on an arbitrary day (for part-of-day tests).
const at = (h) => {
  const d = new Date(2026, 5, 15)
  d.setHours(h, 0, 0, 0)
  return d.getTime()
}

describe('weekStart', () => {
  it('returns the local Sunday that opens the week', () => {
    const ws = weekStart(TODAY)
    expect(ws.getDay()).toBe(0)
    expect(ws.getDate()).toBe(14)
  })
})

describe('weekReview — weekly aggregation', () => {
  it('sums this vs last week, counting only known minutes', () => {
    const log = {
      [key(2026, 5, 15)]: { sessions: 2, minutes: 50 }, // this week (Mon)
      [key(2026, 5, 17)]: { sessions: 1, minutes: null }, // this week (Wed, backfilled)
      [key(2026, 5, 8)]: { sessions: 1, minutes: 25 }, // last week (Mon)
      [key(2026, 5, 10)]: { sessions: 1, minutes: 25 }, // last week (Wed)
    }
    const r = weekReview(log, { today: TODAY })
    expect(r.thisWeek).toEqual({ sessions: 3, minutes: 50, activeDays: 2 })
    expect(r.lastWeek).toEqual({ sessions: 2, minutes: 50, activeDays: 2 })
    expect(r.trend).toBe('up')
  })

  it('buckets the Sat/Sun boundary into the right weeks', () => {
    const log = {
      [key(2026, 5, 13)]: { sessions: 1, minutes: 25 }, // last week Saturday
      [key(2026, 5, 14)]: { sessions: 1, minutes: 25 }, // this week Sunday
    }
    const r = weekReview(log, { today: TODAY })
    expect(r.thisWeek.sessions).toBe(1)
    expect(r.lastWeek.sessions).toBe(1)
  })

  it('marks the first active week as "first" when there is nothing to compare', () => {
    const log = { [key(2026, 5, 15)]: { sessions: 1, minutes: 25 } }
    expect(weekReview(log, { today: TODAY }).trend).toBe('first')
  })

  it('reads a quieter week as "down" and an equal week as "steady"', () => {
    const down = {
      [key(2026, 5, 15)]: { sessions: 1, minutes: 25 },
      [key(2026, 5, 8)]: { sessions: 3, minutes: 75 },
    }
    expect(weekReview(down, { today: TODAY }).trend).toBe('down')

    const steady = {
      [key(2026, 5, 15)]: { sessions: 2, minutes: 50 },
      [key(2026, 5, 8)]: { sessions: 2, minutes: 50 },
    }
    expect(weekReview(steady, { today: TODAY }).trend).toBe('steady')
  })

  it('defaults to an empty, calm review when there is no data', () => {
    const r = weekReview({}, { today: TODAY, streak: 5 })
    expect(r.thisWeek).toEqual({ sessions: 0, minutes: 0, activeDays: 0 })
    expect(r.lastWeek).toEqual({ sessions: 0, minutes: 0, activeDays: 0 })
    expect(r.trend).toBe('first')
    expect(r.bestPartOfDay).toBeNull()
    expect(r.recentReflections).toEqual([])
    expect(r.streak).toBe(5)
  })
})

describe('bestPartOfDay', () => {
  it('returns the most common part of day from garden timestamps', () => {
    expect(bestPartOfDay([{ ts: at(9) }, { ts: at(10) }, { ts: at(14) }])).toBe('morning')
    expect(bestPartOfDay([{ ts: at(13) }])).toBe('afternoon')
    expect(bestPartOfDay([{ ts: at(19) }])).toBe('evening')
    expect(bestPartOfDay([{ ts: at(23) }, { ts: at(2) }])).toBe('night')
  })

  it('breaks ties toward the earlier part of day', () => {
    expect(bestPartOfDay([{ ts: at(9) }, { ts: at(19) }])).toBe('morning')
  })

  it('returns null when there are no sessions, ignoring malformed entries', () => {
    expect(bestPartOfDay([])).toBeNull()
    expect(bestPartOfDay([null, { ts: null }])).toBeNull()
  })

  it('flows through weekReview from the garden', () => {
    expect(weekReview({}, { today: TODAY, garden: [{ ts: at(9) }] }).bestPartOfDay).toBe('morning')
  })
})

describe('weekReview — recent reflections', () => {
  it('returns reflections newest-first, capped to the limit', () => {
    const reflections = [
      { ts: 100, mood: 'sun', note: 'a' },
      { ts: 300, mood: 'rain', note: 'c' },
      { ts: 200, mood: 'cloud', note: 'b' },
      { ts: 50, mood: 'sun' },
      { ts: 400, mood: 'cloud' },
      { ts: 250, mood: 'rain' },
    ]
    const r = weekReview({}, { today: TODAY, reflections, recentLimit: 3 })
    expect(r.recentReflections.map((x) => x.ts)).toEqual([400, 300, 250])
  })

  it('drops malformed reflection entries', () => {
    const r = weekReview(
      {},
      {
        today: TODAY,
        reflections: [{ ts: null }, null, { ts: 10, mood: 'sun', note: 'keep' }],
      },
    )
    expect(r.recentReflections).toHaveLength(1)
    expect(r.recentReflections[0].note).toBe('keep')
  })
})
