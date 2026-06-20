import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  BOX_DAYS,
  MAX_BOX,
  gradeCard,
  isDue,
  countDue,
  normalizeCard,
  makeCard,
  nextIntervalLabel,
  decksOf,
  masteredCount,
  parseBulk,
  recordReview,
  retentionPct,
  makeStats,
} from './flashcards.js'

const DAY = 24 * 60 * 60 * 1000
// A fixed clock so due-date math is deterministic.
const NOW = new Date('2026-06-19T12:00:00.000Z').getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('gradeCard — Leitner promotion/demotion + interval math', () => {
  it('again resets to box 1, due now, and increments struggling', () => {
    const card = makeCard('q', 'a', 'D')
    const graded = gradeCard({ ...card, box: 4, struggling: 0 }, 'again')
    expect(graded.box).toBe(1)
    expect(graded.interval).toBe(0)
    expect(graded.due).toBe(NOW)
    expect(graded.struggling).toBe(1)
    expect(graded.reps).toBe(1)
  })

  it('hard keeps the card near box 1 with a one-day interval', () => {
    const graded = gradeCard(makeCard('q', 'a', 'D'), 'hard')
    expect(graded.box).toBe(1)
    expect(graded.interval).toBe(1)
    expect(graded.due).toBe(NOW + 1 * DAY)
  })

  it('good promotes one box and uses that box interval', () => {
    const graded = gradeCard({ ...makeCard('q', 'a', 'D'), box: 2 }, 'good')
    expect(graded.box).toBe(3)
    expect(graded.interval).toBe(BOX_DAYS[3]) // 7
    expect(graded.due).toBe(NOW + BOX_DAYS[3] * DAY)
  })

  it('easy jumps two boxes and takes the larger of box interval / interval*2', () => {
    const graded = gradeCard({ ...makeCard('q', 'a', 'D'), box: 1, interval: 10 }, 'easy')
    expect(graded.box).toBe(3)
    expect(graded.interval).toBe(Math.max(BOX_DAYS[3], 10 * 2)) // max(7,20)=20
  })

  it('never promotes beyond MAX_BOX', () => {
    const graded = gradeCard({ ...makeCard('q', 'a', 'D'), box: MAX_BOX }, 'easy')
    expect(graded.box).toBe(MAX_BOX)
  })

  it('decrements struggling (not below zero) on good/easy', () => {
    const graded = gradeCard({ ...makeCard('q', 'a', 'D'), struggling: 0 }, 'good')
    expect(graded.struggling).toBe(0)
  })
})

describe('isDue / countDue', () => {
  it('treats cards with past or present due as due', () => {
    expect(isDue({ due: NOW })).toBe(true)
    expect(isDue({ due: NOW - 1000 })).toBe(true)
    expect(isDue({ due: NOW + 1000 })).toBe(false)
  })
  it('a missing due date counts as due (new card)', () => {
    expect(isDue({})).toBe(true)
  })
  it('countDue counts only due cards', () => {
    expect(countDue([{ due: NOW - 1 }, { due: NOW + DAY }, { due: NOW }])).toBe(2)
  })
})

describe('normalizeCard', () => {
  it('fills defaults for legacy cards without clobbering set fields', () => {
    const n = normalizeCard({ front: 'f', back: 'b', box: 3 })
    expect(n.box).toBe(3)
    expect(n.deck).toBe('My deck')
    expect(n.struggling).toBe(0)
    expect(n.reps).toBe(0)
  })
})

// Session-queue building now lives in scheduler.buildQueue (see scheduler.test.js).

describe('decksOf / masteredCount', () => {
  it('aggregates totals and due counts per deck, sorted by due desc then name', () => {
    const cards = [
      { deck: 'B', due: NOW - 1 },
      { deck: 'B', due: NOW - 1 },
      { deck: 'A', due: NOW + DAY }, // not due
    ]
    const decks = decksOf(cards)
    // B has 2 due, A has 0 due → B sorts first by due desc.
    expect(decks[0]).toMatchObject({ deck: 'B', total: 2, due: 2 })
    expect(decks.find((d) => d.deck === 'A')).toMatchObject({ total: 1, due: 0 })
  })
  it('counts mastered cards (box >= MAX_BOX)', () => {
    expect(masteredCount([{ box: MAX_BOX }, { box: 1 }, { box: MAX_BOX }])).toBe(2)
  })
})

describe('nextIntervalLabel', () => {
  it('describes the resulting interval for each rating', () => {
    const card = makeCard('q', 'a', 'D')
    expect(nextIntervalLabel(card, 'again')).toBe('today')
    expect(nextIntervalLabel(card, 'hard')).toBe('1 day')
    expect(nextIntervalLabel({ ...card, box: 2 }, 'good')).toBe('7 days')
  })
})

describe('parseBulk', () => {
  it('parses term — definition lines with assorted separators', () => {
    const text = [
      'hippocampus — memory',
      'dopamine - reward',
      'qualia: subjective feel',
      '',
      'no separator here',
    ].join('\n')
    const cards = parseBulk(text, 'Neuro')
    expect(cards).toHaveLength(3)
    expect(cards[0]).toMatchObject({ front: 'hippocampus', back: 'memory', deck: 'Neuro' })
    expect(cards[2]).toMatchObject({ front: 'qualia', back: 'subjective feel' })
  })
  it('skips lines with an empty side', () => {
    expect(parseBulk('term — \n — def', 'D')).toHaveLength(0)
  })
  it('parses CSV (comma) and tab-separated lines, splitting on the first separator', () => {
    const csv = parseBulk('mitochondria,the powerhouse, of the cell', 'Bio')
    expect(csv).toHaveLength(1)
    expect(csv[0]).toMatchObject({ front: 'mitochondria', back: 'the powerhouse, of the cell' })
    const tab = parseBulk('axon\tcarries signals away', 'Bio')
    expect(tab[0]).toMatchObject({ front: 'axon', back: 'carries signals away' })
  })
  it('prefers a dash over a later comma', () => {
    const cards = parseBulk('a, b — c', 'D')
    expect(cards[0]).toMatchObject({ front: 'a, b', back: 'c' })
  })
})

describe('recordReview / retentionPct — kind stats', () => {
  it('counts a correct review and starts a streak', () => {
    const s = recordReview(makeStats(), 'good')
    expect(s.total).toBe(1)
    expect(s.correct).toBe(1)
    expect(s.streak).toBe(1)
    expect(s.reviewedToday).toBe(1)
  })
  it('does not count "again" as correct', () => {
    const s = recordReview(makeStats(), 'again')
    expect(s.total).toBe(1)
    expect(s.correct).toBe(0)
  })
  it('retentionPct is null with no reviews, else a rounded percentage', () => {
    expect(retentionPct(makeStats())).toBeNull()
    expect(retentionPct({ correct: 3, total: 4 })).toBe(75)
  })
})
