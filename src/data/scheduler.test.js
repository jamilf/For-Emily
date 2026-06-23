import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  localDayStr,
  startOfDay,
  endOfDay,
  isDueToday,
  dueToday,
  isNewCard,
  buildQueue,
  studyAhead,
  dedupeCards,
  isLeech,
  leeches,
  forecast,
} from './scheduler.js'

const DAY = 24 * 60 * 60 * 1000
// Local noon, so "today" math doesn't straddle a UTC boundary in the test runner.
const NOW = new Date(2026, 5, 19, 12, 0, 0).getTime() // 2026-06-19 12:00 local

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('local day helpers (timezone-correct boundaries)', () => {
  it('localDayStr is a local YYYY-MM-DD', () => {
    expect(localDayStr(new Date(2026, 5, 19, 23, 30))).toBe('2026-06-19')
    expect(localDayStr(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
  })
  it('startOfDay/endOfDay bracket the local day', () => {
    expect(startOfDay(new Date(NOW))).toBeLessThanOrEqual(NOW)
    expect(endOfDay(new Date(NOW))).toBeGreaterThan(NOW)
    expect(endOfDay(new Date(NOW)) - startOfDay(new Date(NOW))).toBe(DAY - 1)
  })
})

describe('isDueToday — includes overdue AND anything due later today', () => {
  it('counts a card due earlier today (overdue)', () => {
    expect(isDueToday({ due: NOW - 3 * DAY }, NOW)).toBe(true)
  })
  it('counts a card due later today (not yet reached the clock time)', () => {
    expect(isDueToday({ due: NOW + 5 * 60 * 1000 }, NOW)).toBe(true) // 5 min from now
  })
  it('does NOT count a card due tomorrow', () => {
    expect(isDueToday({ due: NOW + DAY }, NOW)).toBe(false)
  })
  it('treats a missing due date as due (new card)', () => {
    expect(isDueToday({}, NOW)).toBe(true)
  })
})

describe('dueToday + new-card cap', () => {
  const cards = [
    { id: 1, deck: 'D', due: NOW - DAY, reps: 3 }, // due review
    { id: 2, deck: 'D', due: NOW, reps: 0 }, // new
    { id: 3, deck: 'D', due: NOW, reps: 0 }, // new
    { id: 4, deck: 'D', due: NOW, reps: 0 }, // new
    { id: 5, deck: 'D', due: NOW + DAY, reps: 1 }, // not due
  ]
  it('dueToday returns all cards due today regardless of clock time', () => {
    expect(
      dueToday(cards, NOW)
        .map((c) => c.id)
        .sort(),
    ).toEqual([1, 2, 3, 4])
  })
  it('isNewCard detects never-reviewed cards', () => {
    expect(isNewCard({ reps: 0 })).toBe(true)
    expect(isNewCard({ reps: 2 })).toBe(false)
  })
  it('buildQueue caps the number of NEW cards per session (ADHD overwhelm guard)', () => {
    const q = buildQueue(cards, { now: NOW, newPerDay: 1, shuffle: false, cap: 50 })
    const newOnes = q.filter((c) => isNewCard(c))
    expect(newOnes).toHaveLength(1) // only 1 new card admitted
    // Due reviews are always included (id 1).
    expect(q.some((c) => c.id === 1)).toBe(true)
  })
  it('buildQueue respects the session cap and filters by deck', () => {
    const q = buildQueue(cards, { now: NOW, cap: 2, shuffle: false, deck: 'D' })
    expect(q.length).toBeLessThanOrEqual(2)
  })

  it('interleaves due cards across decks when no deck is selected (deck: null)', () => {
    // Two decks, both with due reviews. With deck=null they should mix into one
    // queue (the quick-review default) rather than studying one deck blocked.
    const multi = [
      { id: 11, deck: 'Neuro', due: NOW - DAY, reps: 2 },
      { id: 12, deck: 'Neuro', due: NOW - DAY, reps: 2 },
      { id: 13, deck: 'Philosophy', due: NOW - DAY, reps: 2 },
      { id: 14, deck: 'Philosophy', due: NOW - DAY, reps: 2 },
    ]
    const q = buildQueue(multi, { now: NOW, cap: 50, shuffle: false, deck: null })
    const decksInQueue = new Set(q.map((c) => c.deck))
    expect(decksInQueue).toEqual(new Set(['Neuro', 'Philosophy'])) // both present, pooled
  })

  it('quick-review smart default builds a queue capped at ten', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: 100 + i,
      deck: i % 2 ? 'A' : 'B',
      due: NOW - DAY,
      reps: 2,
    }))
    const q = buildQueue(many, { now: NOW, cap: 10, shuffle: true, deck: null, newPerDay: 10 })
    expect(q.length).toBe(10)
  })
})

describe('studyAhead — pull not-yet-due cards forward', () => {
  it('returns cards due within N days but not due today, soonest first', () => {
    const cards = [
      { id: 1, due: NOW + DAY },
      { id: 2, due: NOW + 2 * DAY },
      { id: 3, due: NOW + 10 * DAY },
      { id: 4, due: NOW - DAY }, // already due today — excluded
    ]
    const ahead = studyAhead(cards, 3, NOW)
    expect(ahead.map((c) => c.id)).toEqual([1, 2])
  })
})

describe('dedupeCards — validate + de-duplicate on import', () => {
  it('drops incoming cards that duplicate existing ones (case/space-insensitive)', () => {
    const existing = [{ deck: 'Neuro', front: 'Hippocampus', back: 'memory' }]
    const incoming = [
      { deck: 'neuro', front: '  hippocampus ', back: 'MEMORY' }, // dup
      { deck: 'Neuro', front: 'Amygdala', back: 'fear' }, // new
    ]
    const { added, duplicates } = dedupeCards(existing, incoming)
    expect(added).toHaveLength(1)
    expect(added[0].front).toBe('Amygdala')
    expect(duplicates).toBe(1)
  })
  it('also de-duplicates within the incoming batch', () => {
    const { added, duplicates } = dedupeCards(
      [],
      [
        { deck: 'D', front: 'a', back: 'b' },
        { deck: 'D', front: 'a', back: 'b' },
      ],
    )
    expect(added).toHaveLength(1)
    expect(duplicates).toBe(1)
  })
})

describe('leech detection (gentle, never punitive)', () => {
  it('flags cards failed many times', () => {
    expect(isLeech({ struggling: 4 })).toBe(true)
    expect(isLeech({ struggling: 1 })).toBe(false)
    expect(isLeech({ struggling: 6 }, 5)).toBe(true)
  })
  it('lists leeches', () => {
    const cards = [
      { id: 1, struggling: 5 },
      { id: 2, struggling: 0 },
      { id: 3, struggling: 4 },
    ]
    expect(leeches(cards).map((c) => c.id)).toEqual([1, 3])
  })
})

describe('forecast — calm upcoming-reviews outlook', () => {
  it('counts cards due per local day for the next N days', () => {
    const cards = [
      { due: NOW }, // today
      { due: NOW + DAY }, // +1
      { due: NOW + DAY + 60 * 1000 }, // +1
      { due: NOW + 3 * DAY }, // +3
    ]
    const f = forecast(cards, 4, NOW)
    expect(f).toHaveLength(4)
    expect(f[0]).toMatchObject({ offset: 0, count: 1 })
    expect(f[1]).toMatchObject({ offset: 1, count: 2 })
    expect(f[3]).toMatchObject({ offset: 3, count: 1 })
  })
})
