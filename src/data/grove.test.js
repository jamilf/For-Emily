import { describe, it, expect } from 'vitest'
import {
  SPECIES,
  dnaOf,
  groveMetrics,
  progressFor,
  hintFor,
  timesGrown,
  isUnlocked,
  unlockedCount,
  reconcile,
  pickPlantableDna,
  nextBloom,
} from './grove.js'
import { generate } from '../pixel/PlantGenerator.js'

// A timestamp at a given local hour today.
function atHour(h) {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.getTime()
}
const tree = (dna, ts = Date.now()) => ({ id: dna, ts })

describe('catalogue integrity', () => {
  it('has ~20 species with unique ids and valid presets', () => {
    expect(SPECIES.length).toBeGreaterThanOrEqual(18)
    expect(SPECIES.length).toBeLessThanOrEqual(24)
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length)
  })
  it('every species dna renders deterministically with the real generator', () => {
    for (const s of SPECIES) {
      const dna = dnaOf(s)
      expect(generate(dna, s.stage || 'mature')).toEqual(generate(dna, s.stage || 'mature'))
    }
  })
  it('dnaOf round-trips through the generator decode (shape/palette honoured)', () => {
    // dna = shape + trunk*4 + pattern*12 + palette*36
    expect(dnaOf({ shape: 2, palette: 4 })).toBe(2 + 4 * 36)
  })
})

describe('groveMetrics — derived from existing stores', () => {
  it('reads grown, minutes, streak, reviews, reflections', () => {
    const m = groveMetrics({
      garden: [tree(1), tree(2), tree(3)],
      stats: { streak: 4 },
      flashcardStats: { total: 22 },
      reflections: [{}, {}],
    })
    expect(m.grown).toBe(3)
    expect(m.minutes).toBe(75)
    expect(m.streak).toBe(4)
    expect(m.reviews).toBe(22)
    expect(m.reflections).toBe(2)
  })
  it('detects before-noon and after-dark from tree timestamps', () => {
    expect(groveMetrics({ garden: [tree(1, atHour(9))] }).beforeNoon).toBe(true)
    expect(groveMetrics({ garden: [tree(1, atHour(14))] }).beforeNoon).toBe(false)
    expect(groveMetrics({ garden: [tree(1, atHour(21))] }).afterDark).toBe(true)
    expect(groveMetrics({ garden: [tree(1, atHour(3))] }).afterDark).toBe(true)
    expect(groveMetrics({ garden: [tree(1, atHour(13))] }).afterDark).toBe(false)
  })
})

describe('progressFor — every rule type', () => {
  const m = groveMetrics({
    garden: Array.from({ length: 6 }, (_, i) => tree(i, atHour(10))),
    stats: { streak: 3 },
    flashcardStats: { total: 20 },
    reflections: [{}],
  })
  it('numeric rules clamp current to target and flag done', () => {
    const grown6 = progressFor({ rule: { metric: 'grown', n: 6 } }, m)
    expect(grown6).toEqual({ current: 6, target: 6, done: true })
    const grown10 = progressFor({ rule: { metric: 'grown', n: 10 } }, m)
    expect(grown10).toEqual({ current: 6, target: 10, done: false })
  })
  it('minutes derive from grown × 25', () => {
    expect(progressFor({ rule: { metric: 'minutes', n: 150 } }, m).current).toBe(150)
  })
  it('boolean rules (beforeNoon/afterDark)', () => {
    expect(progressFor({ rule: { metric: 'beforeNoon' } }, m).done).toBe(true)
    expect(progressFor({ rule: { metric: 'afterDark' } }, m).done).toBe(false)
  })
  it('streak / reviews / reflections', () => {
    expect(progressFor({ rule: { metric: 'streak', n: 3 } }, m).done).toBe(true)
    expect(progressFor({ rule: { metric: 'reviews', n: 20 } }, m).done).toBe(true)
    expect(progressFor({ rule: { metric: 'reflections', n: 1 } }, m).done).toBe(true)
  })
})

describe('hintFor', () => {
  it('hides the rule for mystery species', () => {
    expect(hintFor({ mystery: true, rule: { metric: 'grown', n: 30 } })).toMatch(/mystery/i)
  })
  it('describes the rule otherwise', () => {
    expect(hintFor({ rule: { metric: 'streak', n: 7 } })).toMatch(/7-day streak/i)
  })
})

describe('reconcile — sticky, retroactive unlocks', () => {
  it('marks every already-earned species unlocked on first run', () => {
    const metrics = groveMetrics({ garden: [tree(0), tree(1)], stats: { streak: 0 } })
    const { grove, newlyUnlocked } = reconcile({ unlocked: {} }, metrics, '2026-06-20')
    // grown>=1 and grown>=2 species should unlock.
    expect(
      isUnlocked(
        SPECIES.find((s) => s.id === 'first-sprout'),
        grove,
      ),
    ).toBe(true)
    expect(grove.unlocked['first-sprout']).toBe('2026-06-20')
    expect(newlyUnlocked.length).toBeGreaterThan(0)
  })
  it('never removes an unlock even if the metric later drops (sticky streak)', () => {
    const earned = reconcile(
      { unlocked: {} },
      groveMetrics({ stats: { streak: 7 }, garden: [] }),
      '2026-06-01',
    ).grove
    expect(
      isUnlocked(
        SPECIES.find((s) => s.id === 'deeproots-oak'),
        earned,
      ),
    ).toBe(true)
    // Streak resets to 0 — still unlocked.
    const after = reconcile(earned, groveMetrics({ stats: { streak: 0 }, garden: [] }), '2026-06-02')
    expect(
      isUnlocked(
        SPECIES.find((s) => s.id === 'deeproots-oak'),
        after.grove,
      ),
    ).toBe(true)
    expect(after.newlyUnlocked).toHaveLength(0)
  })
  it('preserves plantNext and existing dates', () => {
    const prev = { unlocked: { 'first-sprout': '2026-01-01' }, plantNext: 42 }
    const out = reconcile(prev, groveMetrics({ garden: [tree(0), tree(1)] }), '2026-06-20')
    expect(out.grove.unlocked['first-sprout']).toBe('2026-01-01') // unchanged
    expect(out.grove.plantNext).toBe(42)
  })
})

describe('timesGrown / pickPlantableDna / nextBloom / unlockedCount', () => {
  it('counts grown instances of a catalogued species from the garden', () => {
    const sp = SPECIES[0]
    const garden = [tree(dnaOf(sp)), tree(dnaOf(sp)), tree(99999)]
    expect(timesGrown(sp, garden)).toBe(2)
  })
  it('pickPlantableDna returns an unlocked species dna, or null when none', () => {
    expect(pickPlantableDna({ unlocked: {} })).toBeNull()
    const dna = pickPlantableDna({ unlocked: { 'quiet-pine': '2026-01-01' } })
    expect(dna).toBe(dnaOf(SPECIES.find((s) => s.id === 'quiet-pine')))
  })
  it('nextBloom surfaces the closest locked species', () => {
    // grown 5: closest grown rule is sunfacer-oak (n=6) at 5/6.
    const grove = { unlocked: {} }
    const metrics = groveMetrics({ garden: Array.from({ length: 5 }, (_, i) => tree(i, atHour(14))) })
    const nb = nextBloom(grove, metrics)
    expect(nb).toBeTruthy()
    expect(progressFor(nb, metrics).done).toBe(false)
  })
  it('unlockedCount tallies the map', () => {
    expect(unlockedCount({ unlocked: { a: 'x', b: 'y' } })).toBe(2)
  })
})
