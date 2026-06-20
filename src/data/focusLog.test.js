import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  localYMD,
  backfillFromGarden,
  recordSession,
  bucketFor,
  lastNWeeks,
  activeWithin,
  summarize,
} from './focusLog.js'

// Local noon so "today" math never straddles a UTC boundary in the runner.
const NOW = new Date(2026, 5, 19, 12, 0, 0).getTime() // Fri 2026-06-19 12:00 local

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('localYMD', () => {
  it('returns a LOCAL YYYY-MM-DD for a timestamp or Date', () => {
    expect(localYMD(new Date(2026, 5, 19, 23, 30))).toBe('2026-06-19')
    expect(localYMD(new Date(2026, 5, 19, 23, 30).getTime())).toBe('2026-06-19')
  })

  it('buckets by local midnight — ts just before/after midnight land on different days', () => {
    // DST note: localDayStr reads calendar fields (year/month/date), so it is
    // unaffected by DST offset changes — these boundaries are wall-clock correct.
    const before = new Date(2026, 5, 19, 23, 59, 59).getTime()
    const after = new Date(2026, 5, 20, 0, 0, 1).getTime()
    expect(localYMD(before)).toBe('2026-06-19')
    expect(localYMD(after)).toBe('2026-06-20')
  })
})

describe('backfillFromGarden', () => {
  it('buckets garden timestamps into per-local-day session counts, minutes null', () => {
    const garden = [
      { id: 0, ts: new Date(2026, 5, 18, 9, 0).getTime() },
      { id: 1, ts: new Date(2026, 5, 18, 14, 0).getTime() },
      { id: 2, ts: new Date(2026, 5, 19, 8, 0).getTime() },
    ]
    const log = backfillFromGarden(garden)
    expect(log['2026-06-18']).toEqual({ sessions: 2, minutes: null })
    expect(log['2026-06-19']).toEqual({ sessions: 1, minutes: null })
  })

  it('is idempotent (same input → same output) and skips malformed entries', () => {
    const garden = [{ ts: new Date(2026, 5, 19, 8, 0).getTime() }, null, { id: 9 }]
    const a = backfillFromGarden(garden)
    const b = backfillFromGarden(garden)
    expect(a).toEqual(b)
    expect(a['2026-06-19']).toEqual({ sessions: 1, minutes: null })
    expect(Object.keys(a)).toHaveLength(1)
  })

  it('handles an empty garden', () => {
    expect(backfillFromGarden([])).toEqual({})
    expect(backfillFromGarden()).toEqual({})
  })
})

describe('recordSession', () => {
  it('increments the day and accumulates minutes without mutating the input', () => {
    const log = {}
    const ts = new Date(2026, 5, 19, 10, 0).getTime()
    const next = recordSession(log, { ts, minutes: 25 })
    expect(next['2026-06-19']).toEqual({ sessions: 1, minutes: 25 })
    const next2 = recordSession(next, { ts, minutes: 25 })
    expect(next2['2026-06-19']).toEqual({ sessions: 2, minutes: 50 })
    expect(log).toEqual({}) // original untouched
  })

  it('treats a backfilled null minutes total as 0 once a real session lands', () => {
    const log = { '2026-06-12': { sessions: 2, minutes: null } }
    const ts = new Date(2026, 5, 12, 9, 0).getTime()
    const next = recordSession(log, { ts, minutes: 25 })
    expect(next['2026-06-12']).toEqual({ sessions: 3, minutes: 25 })
  })
})

describe('bucketFor', () => {
  it('caps at 4 and floors at 0', () => {
    expect(bucketFor(0)).toBe(0)
    expect(bucketFor(-3)).toBe(0)
    expect(bucketFor(1)).toBe(1)
    expect(bucketFor(2)).toBe(2)
    expect(bucketFor(3)).toBe(3)
    expect(bucketFor(4)).toBe(4)
    expect(bucketFor(9)).toBe(4)
    expect(bucketFor()).toBe(0)
  })
})

describe('lastNWeeks', () => {
  it('builds a 7-lane × N-week grid', () => {
    const grid = lastNWeeks({}, new Date(NOW), 16)
    expect(grid).toHaveLength(7)
    grid.forEach((lane) => expect(lane).toHaveLength(16))
  })

  it('puts today in the last column and marks days after today as inFuture', () => {
    const grid = lastNWeeks({}, new Date(NOW), 16)
    // 2026-06-19 is a Friday → weekday lane 5, last column.
    const todayCell = grid[5][15]
    expect(todayCell.ymd).toBe('2026-06-19')
    expect(todayCell.isToday).toBe(true)
    expect(todayCell.inFuture).toBe(false)
    // Saturday in the same (last) week is tomorrow → inFuture.
    expect(grid[6][15].inFuture).toBe(true)
    // Past lanes are never future.
    expect(grid[4][15].inFuture).toBe(false)
  })

  it('reflects a populated day from the log', () => {
    const log = { '2026-06-17': { sessions: 3, minutes: 75 } }
    const grid = lastNWeeks(log, new Date(NOW), 16)
    const cell = grid.flat().find((c) => c.ymd === '2026-06-17')
    expect(cell).toMatchObject({ sessions: 3, minutes: 75 })
  })
})

describe('activeWithin', () => {
  it('counts active days in the trailing window (including today)', () => {
    const log = {
      '2026-06-19': { sessions: 1, minutes: 25 }, // today
      '2026-06-17': { sessions: 2, minutes: null },
      '2026-06-10': { sessions: 1, minutes: null }, // outside a 7-day window
    }
    expect(activeWithin(log, new Date(NOW), 7)).toBe(2)
    expect(activeWithin(log, new Date(NOW), 1)).toBe(1)
  })
})

describe('summarize', () => {
  it('totals sessions, known minutes, and active days; passes the streak through', () => {
    const log = {
      '2026-06-18': { sessions: 3, minutes: 75 },
      '2026-06-19': { sessions: 1, minutes: 25 },
      '2026-06-12': { sessions: 2, minutes: null }, // backfilled: minutes unknown
      '2026-06-11': { sessions: 0, minutes: null }, // not an active day
    }
    const s = summarize(log, { streak: 4 })
    expect(s.totalSessions).toBe(6)
    expect(s.totalKnownMinutes).toBe(100) // null day excluded
    expect(s.activeDays).toBe(3)
    expect(s.bestDay).toMatchObject({ ymd: '2026-06-18', sessions: 3 })
    expect(s.currentStreak).toBe(4) // reused, not recomputed
  })

  it('defaults the streak to 0 and bestDay to null on an empty log', () => {
    const s = summarize({}, {})
    expect(s).toMatchObject({
      totalSessions: 0,
      totalKnownMinutes: 0,
      activeDays: 0,
      bestDay: null,
      currentStreak: 0,
    })
  })
})
