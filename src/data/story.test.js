import { describe, it, expect } from 'vitest'
import {
  CHAPTERS,
  COMEBACK_GAP_DAYS,
  COMEBACK_NOTES,
  GREETINGS,
  RETURN,
  buildComeback,
  classifyReturn,
  dailySeed,
  dayGap,
  deriveCurrentChapter,
  greetingFacts,
  nextChapter,
  pickGreeting,
  storyMetrics,
  unlockedChapters,
} from './story.js'

const at = (n, h = 12) => ({
  garden: Array.from({ length: n }, (_, i) => ({ id: 0, ts: new Date(2026, 5, 10, h).getTime() - i })),
})

describe('storyMetrics', () => {
  it('derives only monotonic metrics from the existing stores', () => {
    const m = storyMetrics({
      garden: [
        { id: 0, ts: 1 },
        { id: 1, ts: 2 },
      ],
      spirits: { unlocked: { curiosity: true } },
      reflections: [{}, {}],
      flashcardStats: { total: 40 },
      focusLog: { '2026-06-10': { sessions: 2 }, '2026-06-11': { sessions: 0 } },
      stats: { streak: 5 },
    })
    expect(m).toMatchObject({
      grown: 2,
      spiritsMet: 1,
      reflections: 2,
      reviews: 40,
      activeDays: 1,
      streak: 5,
    })
  })
})

describe('deriveCurrentChapter — retroactive, sticky, boundaries', () => {
  it('is null before the first session', () => {
    expect(deriveCurrentChapter(storyMetrics(at(0)))).toBeNull()
  })

  it('unlocks chapter 1 at the very first tree (retroactive)', () => {
    expect(deriveCurrentChapter(storyMetrics(at(1)))?.id).toBe('stirs')
  })

  it('advances to the next chapter exactly at its threshold', () => {
    expect(deriveCurrentChapter(storyMetrics(at(2)))?.id).toBe('stirs') // 2 < 3
    expect(deriveCurrentChapter(storyMetrics(at(3)))?.id).toBe('mossbright') // == 3
  })

  it('returns the furthest chapter for a large history, and never past the last', () => {
    expect(deriveCurrentChapter(storyMetrics(at(45)))?.id).toBe('evergreen')
    expect(deriveCurrentChapter(storyMetrics(at(1000)))?.id).toBe('evergreen')
  })

  it('chapter gates are strictly increasing on grown (nested + sticky)', () => {
    const ns = CHAPTERS.map((c) => c.rule.n)
    for (let i = 1; i < ns.length; i++) expect(ns[i]).toBeGreaterThan(ns[i - 1])
    expect(CHAPTERS.every((c) => c.rule.metric === 'grown')).toBe(true)
  })

  it('unlockedChapters is a contiguous prefix; nextChapter is the first locked one', () => {
    const m = storyMetrics(at(10))
    const unlocked = unlockedChapters(m)
    expect(unlocked.map((c) => c.id)).toEqual(['stirs', 'mossbright', 'keeper', 'lanternlight'])
    expect(nextChapter(m)?.id).toBe('hollow')
  })
})

describe('classifyReturn — LOCAL day + tunable thresholds', () => {
  const t = (y, mo, d, h, mi = 0) => new Date(y, mo, d, h, mi).getTime()

  it('a fresh install (no lastSeen) reads as first-day', () => {
    expect(classifyReturn(null, t(2026, 5, 11, 9))).toBe(RETURN.FIRST)
    expect(classifyReturn(0, t(2026, 5, 11, 9))).toBe(RETURN.FIRST)
  })

  it('same local day reads as same-day, even hours apart', () => {
    expect(classifyReturn(t(2026, 5, 10, 1), t(2026, 5, 10, 23))).toBe(RETURN.SAME)
  })

  it('23:59 → 00:01 next day is a new day (short-gap), not same-day', () => {
    expect(classifyReturn(t(2026, 5, 10, 23, 59), t(2026, 5, 11, 0, 1))).toBe(RETURN.SHORT)
    expect(dayGap(t(2026, 5, 10, 23, 59), t(2026, 5, 11, 0, 1))).toBe(1)
  })

  it('1–2 day gaps are short, exactly COMEBACK_GAP_DAYS is long', () => {
    expect(classifyReturn(t(2026, 5, 10, 12), t(2026, 5, 12, 12))).toBe(RETURN.SHORT) // 2
    expect(COMEBACK_GAP_DAYS).toBe(3)
    expect(classifyReturn(t(2026, 5, 10, 12), t(2026, 5, 13, 12))).toBe(RETURN.LONG) // 3
    expect(classifyReturn(t(2026, 5, 10, 12), t(2026, 5, 20, 12))).toBe(RETURN.LONG) // 10
  })

  it('treats clock skew (now before lastSeen) as same-day, never a fault', () => {
    expect(classifyReturn(t(2026, 5, 12, 12), t(2026, 5, 11, 12))).toBe(RETURN.SAME)
  })
})

describe('greetingFacts — accurate, never fabricated', () => {
  it('reads the last tree species + today’s sessions from real data', () => {
    const today = new Date()
    const f = greetingFacts({
      garden: [{ id: 0, ts: today.getTime() }],
      chapter: CHAPTERS[0],
      now: today.getTime(),
    })
    expect(f.lastTree).toBe('First Sprout') // dna 0 maps to the catalogued species
    expect(f.todaySessions).toBe(1)
    expect(f.chapter).toBe('The Grove Stirs')
  })

  it('leaves fields null when there is no history (so greetings stay neutral)', () => {
    const f = greetingFacts({ garden: [], now: Date.now() })
    expect(f.lastTree).toBeNull()
    expect(f.spirit).toBeNull()
    expect(f.chapter).toBeNull()
  })
})

describe('pickGreeting — deterministic + only uses present facts', () => {
  const seed = dailySeed(123, new Date(2026, 5, 11, 9).getTime())

  it('is deterministic for the same seed + facts + return type', () => {
    const facts = greetingFacts({ garden: [{ id: 0, ts: Date.now() }], now: Date.now() })
    expect(pickGreeting(facts, RETURN.SHORT, seed)).toBe(pickGreeting(facts, RETURN.SHORT, seed))
  })

  it('never interpolates a missing fact (no "null"/"undefined" leaks) for any seed', () => {
    const bare = { name: 'Emily', lastTree: null, spirit: null, chapter: null, todaySessions: 0, grown: 0 }
    for (const rt of Object.values(RETURN)) {
      for (let s = 0; s < 60; s++) {
        const line = pickGreeting(bare, rt, s)
        expect(line).toBeTruthy()
        expect(line.toLowerCase()).not.toContain('null')
        expect(line.toLowerCase()).not.toContain('undefined')
      }
    }
  })
})

describe('buildComeback — deterministic, positive gift', () => {
  it('is fully determined by gap + seed', () => {
    const a = buildComeback(5, 42)
    const b = buildComeback(5, 42)
    expect(a).toEqual(b)
    expect(typeof a.bloomDna).toBe('number')
    expect(COMEBACK_NOTES).toContain(a.note)
    expect(a.gapDays).toBe(5)
  })

  it('different seeds can vary the bloom + note', () => {
    const seeds = [0, 1, 2, 3, 4, 5, 6, 7]
    const dnas = new Set(seeds.map((s) => buildComeback(4, s).bloomDna))
    expect(dnas.size).toBeGreaterThan(1)
  })
})

describe('retention ethics — no loss or shame language anywhere', () => {
  const BANNED = [
    'fail',
    'failed',
    'failure',
    'behind',
    'lazy',
    'lost',
    'lose',
    'broke',
    'broken',
    'missed',
    'miss you',
    'guilt',
    'guilty',
    'sorry',
    'should have',
    'disappoint',
    'neglect',
    'ashamed',
    'streak',
    'falling',
    'slack',
  ]
  const corpus = []
  for (const c of CHAPTERS) corpus.push(c.title, ...c.beats, c.hook)
  corpus.push(...COMEBACK_NOTES)
  const richFacts = {
    name: 'Emily',
    lastTree: 'First Sprout',
    spirit: 'Curiosity',
    chapter: 'Mossbright',
    todaySessions: 2,
    grown: 5,
  }
  for (const rt of Object.keys(GREETINGS)) {
    for (const g of GREETINGS[rt]) corpus.push(g.line(richFacts))
  }

  it('contains no banned loss/shame token', () => {
    for (const text of corpus) {
      const lower = text.toLowerCase()
      for (const word of BANNED) {
        expect(lower, `"${text}" contains "${word}"`).not.toContain(word)
      }
    }
  })
})
