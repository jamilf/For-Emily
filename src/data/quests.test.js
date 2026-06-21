import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DAILY_QUEST_COUNT,
  QUEST_POOL,
  dailyQuests,
  questMetricsToday,
  evaluateQuests,
  questSummary,
} from './quests.js'

// Local noon so "today" math never straddles a UTC boundary in the runner.
const NOW = new Date(2026, 5, 19, 12, 0, 0) // Fri 2026-06-19 12:00 local

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('dailyQuests — deterministic per local date', () => {
  it('returns the same set for the same date and differs across dates', () => {
    const a = dailyQuests('2026-06-19')
    const b = dailyQuests('2026-06-19')
    expect(a).toEqual(b) // identical
    const c = dailyQuests('2026-06-20')
    // Different day → different selection and/or targets (not deep-equal).
    expect(JSON.stringify(c)).not.toBe(JSON.stringify(a))
  })

  it('picks DAILY_QUEST_COUNT quests with distinct metrics', () => {
    const quests = dailyQuests('2026-06-19')
    expect(quests).toHaveLength(DAILY_QUEST_COUNT)
    const metrics = quests.map((q) => q.rule.metric)
    expect(new Set(metrics).size).toBe(DAILY_QUEST_COUNT)
  })

  it('draws numeric targets only from each template’s allowed set', () => {
    // Scan a year of dates; every numeric quest target must be allowed.
    const byId = Object.fromEntries(QUEST_POOL.map((t) => [t.id, t]))
    for (let d = 1; d <= 28; d++) {
      const ds = `2026-02-${String(d).padStart(2, '0')}`
      for (const q of dailyQuests(ds)) {
        if (q.rule.n != null) {
          expect(byId[q.id].targets).toContain(q.rule.n)
        }
      }
    }
  })

  it('defaults to the local date when called with no argument', () => {
    expect(dailyQuests()).toEqual(dailyQuests('2026-06-19'))
  })
})

describe('questMetricsToday — live, local-day-correct', () => {
  const tree = (h, dayOffset = 0) => ({
    id: 0,
    ts: new Date(2026, 5, 19 + dayOffset, h, 0).getTime(),
  })

  it('counts only today’s trees by LOCAL day, including a late-night tree', () => {
    const garden = [
      tree(9), // today morning
      tree(23), // today 11pm (still local today)
      tree(10, -1), // yesterday → excluded
    ]
    const m = questMetricsToday({ garden }, NOW)
    expect(m.treesToday).toBe(2)
    expect(m.beforeNoonToday).toBe(true) // the 9am tree
    expect(m.nightToday).toBe(true) // the 11pm tree
  })

  it('flags reflection today by local day', () => {
    const reflections = [
      { ts: new Date(2026, 5, 19, 8).getTime(), mood: 'sun', note: 'good' },
      { ts: new Date(2026, 5, 18, 8).getTime(), mood: 'rain', note: 'old' },
    ]
    expect(questMetricsToday({ reflections }, NOW).reflectionToday).toBe(true)
    expect(questMetricsToday({ reflections: [reflections[1]] }, NOW).reflectionToday).toBe(false)
  })

  it('counts reviews today only when flashcardStats.day matches the UTC day', () => {
    const utc = NOW.toISOString().slice(0, 10)
    expect(questMetricsToday({ flashcardStats: { day: utc, reviewedToday: 12 } }, NOW).reviewsToday).toBe(12)
    expect(
      questMetricsToday({ flashcardStats: { day: '2000-01-01', reviewedToday: 12 } }, NOW).reviewsToday,
    ).toBe(0)
  })

  it('is all-zero for empty input', () => {
    expect(questMetricsToday({}, NOW)).toEqual({
      treesToday: 0,
      reviewsToday: 0,
      reflectionToday: false,
      beforeNoonToday: false,
      nightToday: false,
    })
  })
})

describe('evaluateQuests / questSummary', () => {
  it('marks numeric + boolean quests done against live metrics', () => {
    const quests = [
      { id: 'a', rule: { metric: 'treesToday', n: 3 } },
      { id: 'b', rule: { metric: 'reflectionToday' } },
    ]
    const evald = evaluateQuests(quests, { treesToday: 3, reflectionToday: false })
    expect(evald[0]).toMatchObject({ current: 3, target: 3, done: true })
    expect(evald[1]).toMatchObject({ done: false })
    expect(questSummary(evald)).toEqual({ done: 1, total: 2 })
  })
})
