import { describe, it, expect } from 'vitest'
import { SPIRITS, spiritMetrics, progressForSpirit, reconcileSpirits, isUnlocked } from './spirits.js'

// One garden entry at a given LOCAL hour (date fixed; only the hour matters).
const at = (hour, n = 1) =>
  Array.from({ length: n }, () => ({ id: 0, ts: new Date(2026, 5, 18, hour, 0).getTime() }))

describe('spiritMetrics', () => {
  it('counts before-noon and after-8pm sessions by LOCAL hour', () => {
    const garden = [
      ...at(9, 3), // morning
      ...at(11, 1), // morning (boundary: 11 < 12)
      ...at(21, 2), // night
      ...at(2, 1), // after-midnight tail (counts as "after 8pm")
    ]
    const m = spiritMetrics({ garden })
    expect(m.grown).toBe(7)
    // 9,9,9,11 and the 2am session (h<12) → 5; the windows intentionally overlap
    // for after-midnight hours, matching the Grove's h<12 before-noon semantics.
    expect(m.beforeNoonCount).toBe(5)
    expect(m.after8pmCount).toBe(3) // 21,21,2 (h>=20 || h<5)
  })

  it('treats the night boundary precisely (>=20 or <5; 19 and 5 excluded)', () => {
    expect(spiritMetrics({ garden: at(20) }).after8pmCount).toBe(1)
    expect(spiritMetrics({ garden: at(4) }).after8pmCount).toBe(1)
    expect(spiritMetrics({ garden: at(19) }).after8pmCount).toBe(0)
    expect(spiritMetrics({ garden: at(5) }).after8pmCount).toBe(0)
    expect(spiritMetrics({ garden: at(12) }).beforeNoonCount).toBe(0)
  })

  it('pulls streak/reflections/reviews from the existing stores', () => {
    const m = spiritMetrics({
      stats: { streak: 7 },
      reflections: [{}, {}, {}],
      flashcardStats: { total: 200 },
    })
    expect(m).toMatchObject({ streak: 7, reflections: 3, reviews: 200 })
  })
})

describe('reconcileSpirits — retroactive, sticky, dated', () => {
  const empty = { unlocked: {}, seen: {}, discoveredAt: {} }

  it('unlocks each spirit retroactively when its threshold is met', () => {
    const cases = {
      curiosity: spiritMetrics({ garden: at(13, 1) }),
      dawn: spiritMetrics({ garden: at(9, 10) }),
      nightOwl: spiritMetrics({ garden: at(21, 10) }),
      persistence: spiritMetrics({ stats: { streak: 7 } }),
      reflection: spiritMetrics({ reflections: Array(20).fill({}) }),
      scholar: spiritMetrics({ flashcardStats: { total: 200 } }),
    }
    for (const [id, metrics] of Object.entries(cases)) {
      const { state } = reconcileSpirits(empty, metrics, null)
      expect(state.unlocked[id]).toBe(true)
    }
  })

  it('respects the >= boundary (10 unlocks Dawn; 9 does not)', () => {
    expect(
      reconcileSpirits(empty, spiritMetrics({ garden: at(9, 9) }), null).state.unlocked.dawn,
    ).toBeUndefined()
    expect(reconcileSpirits(empty, spiritMetrics({ garden: at(9, 10) }), null).state.unlocked.dawn).toBe(true)
  })

  it('is sticky — a dropped metric never re-locks a spirit', () => {
    const earned = reconcileSpirits(empty, spiritMetrics({ stats: { streak: 7 } }), null).state
    const later = reconcileSpirits(earned, spiritMetrics({ stats: { streak: 0 } }), Date.now()).state
    expect(later.unlocked.persistence).toBe(true)
  })

  it('stamps discoveredAt with the live ts, or null for a retroactive seed', () => {
    const ts = 1_700_000_000_000
    const live = reconcileSpirits(empty, spiritMetrics({ garden: at(13, 1) }), ts).state
    expect(live.discoveredAt.curiosity).toBe(ts)
    const seeded = reconcileSpirits(empty, spiritMetrics({ garden: at(13, 1) }), null).state
    expect(seeded.discoveredAt.curiosity).toBeNull()
  })

  it('never overwrites an existing discovery date and double-runs as a no-op', () => {
    const metrics = spiritMetrics({ garden: at(13, 1) })
    const first = reconcileSpirits(empty, metrics, null).state // discoveredAt null
    const second = reconcileSpirits(first, metrics, Date.now())
    expect(second.state.discoveredAt.curiosity).toBeNull() // preserved, not re-dated
    expect(second.newlyUnlocked).toHaveLength(0) // nothing new on re-run
    expect(second.state.unlocked).toEqual(first.unlocked)
  })

  it('preserves the seen map across reconciles', () => {
    const withSeen = {
      unlocked: { curiosity: true },
      seen: { curiosity: true },
      discoveredAt: { curiosity: null },
    }
    const out = reconcileSpirits(withSeen, spiritMetrics({ stats: { streak: 7 } }), Date.now()).state
    expect(out.seen.curiosity).toBe(true)
  })
})

describe('progressForSpirit', () => {
  it('reports current/target/done against live metrics', () => {
    const dawn = SPIRITS.find((s) => s.id === 'dawn')
    const p = progressForSpirit(dawn, spiritMetrics({ garden: at(9, 6) }))
    expect(p).toEqual({ current: 6, target: 10, done: false })
    const done = progressForSpirit(dawn, spiritMetrics({ garden: at(9, 12) }))
    expect(done).toEqual({ current: 10, target: 10, done: true })
  })

  it('isUnlocked reads the persisted map', () => {
    const spirit = SPIRITS[0]
    expect(isUnlocked(spirit, { unlocked: { [spirit.id]: true } })).toBe(true)
    expect(isUnlocked(spirit, { unlocked: {} })).toBe(false)
  })
})
