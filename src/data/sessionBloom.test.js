import { describe, it, expect } from 'vitest'
import { bloom, bloomLabel, goldenStart, FIREFLY_CAP } from './sessionBloom.js'
import { SPROUT_AT, SAPLING_AT, MATURE_AT } from './treeGrowth.js'

const MIN25 = { durationSec: 25 * 60 }
const MIN15 = { durationSec: 15 * 60 }

describe('goldenStart — the true final minute', () => {
  it('computes the last 60 seconds from the real duration', () => {
    expect(goldenStart(1500)).toBeCloseTo(0.96)
    expect(goldenStart(900)).toBeCloseTo(1 - 60 / 900)
    expect(goldenStart(2700)).toBeCloseTo(1 - 60 / 2700)
  })

  it('never begins before the tree matures, even for tiny or bad durations', () => {
    expect(goldenStart(60)).toBe(MATURE_AT)
    expect(goldenStart(0)).toBe(MATURE_AT)
    expect(goldenStart(NaN)).toBe(MATURE_AT)
  })
})

describe('bloom — phases', () => {
  it('moves settling -> growing -> golden -> done at the shared thresholds', () => {
    expect(bloom(0, MIN25).phase).toBe('settling')
    expect(bloom(SPROUT_AT - 0.001, MIN25).phase).toBe('settling')
    expect(bloom(SPROUT_AT, MIN25).phase).toBe('growing')
    expect(bloom(SAPLING_AT, MIN25).phase).toBe('growing')
    expect(bloom(0.959, MIN25).phase).toBe('growing')
    expect(bloom(0.96, MIN25).phase).toBe('golden')
    expect(bloom(1, MIN25).phase).toBe('done')
  })

  it('golden lands on the final minute for a custom duration too', () => {
    const start = goldenStart(MIN15.durationSec)
    expect(bloom(start - 0.001, MIN15).phase).toBe('growing')
    expect(bloom(start, MIN15).phase).toBe('golden')
  })

  it('clamps bad fractions calmly', () => {
    expect(bloom(-0.5).phase).toBe('settling')
    expect(bloom(NaN).phase).toBe('settling')
    expect(bloom(1.7).phase).toBe('done')
    expect(bloom(undefined).phase).toBe('settling')
  })
})

describe('bloom — fireflies', () => {
  it('gathers monotonically from 0 to the cap and holds', () => {
    let prev = -1
    for (let f = 0; f <= 1.0001; f += 0.01) {
      const n = bloom(f, MIN25).fireflies
      expect(n).toBeGreaterThanOrEqual(prev)
      expect(n).toBeLessThanOrEqual(FIREFLY_CAP)
      prev = n
    }
    expect(bloom(0, MIN25).fireflies).toBe(0)
    expect(bloom(1, MIN25).fireflies).toBe(FIREFLY_CAP)
    expect(bloom(0.97, MIN25).fireflies).toBe(FIREFLY_CAP) // golden holds the cap
  })
})

describe('bloom — light and flora', () => {
  it('warms gently, then blooms fully for golden and done', () => {
    expect(bloom(0, MIN25).lightWarmth).toBe(0)
    const mid = bloom(0.5, MIN25).lightWarmth
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    expect(bloom(0.97, MIN25).lightWarmth).toBe(1)
    expect(bloom(1, MIN25).lightWarmth).toBe(1)
  })

  it('perks the flora a step at each tree milestone', () => {
    expect(bloom(SPROUT_AT - 0.01, MIN25).floraPerk).toBe(0)
    expect(bloom(SPROUT_AT, MIN25).floraPerk).toBe(0.34)
    expect(bloom(SAPLING_AT, MIN25).floraPerk).toBe(0.67)
    expect(bloom(MATURE_AT, MIN25).floraPerk).toBe(1)
  })
})

describe('bloomLabel', () => {
  it('gives a warm line per phase, falling back to settling, all em-dash-free', () => {
    for (const phase of ['settling', 'growing', 'golden', 'done']) {
      const label = bloomLabel(phase)
      expect(label.length).toBeGreaterThan(0)
      expect(label).not.toContain('—')
    }
    expect(bloomLabel('bogus')).toBe(bloomLabel('settling'))
  })
})
