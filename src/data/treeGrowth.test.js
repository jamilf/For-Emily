import { describe, it, expect } from 'vitest'
import { sessionSeed, growthStageForProgress, growthLabel } from './treeGrowth.js'
import { STAGES, generate } from '../pixel/PlantGenerator.js'

describe('growthStageForProgress', () => {
  it('maps each band to the right stage', () => {
    expect(growthStageForProgress(0)).toBe(0)
    expect(growthStageForProgress(0.15)).toBe(0)
    expect(growthStageForProgress(0.3)).toBe(1)
    expect(growthStageForProgress(0.5)).toBe(1)
    expect(growthStageForProgress(0.62)).toBe(2)
    expect(growthStageForProgress(0.8)).toBe(2)
    expect(growthStageForProgress(0.9)).toBe(3)
    expect(growthStageForProgress(1)).toBe(3)
  })

  it('holds the stage just below each threshold', () => {
    expect(growthStageForProgress(0.2999)).toBe(0)
    expect(growthStageForProgress(0.6199)).toBe(1)
    expect(growthStageForProgress(0.8999)).toBe(2)
  })

  it('clamps negatives, overshoot, and NaN', () => {
    expect(growthStageForProgress(-0.5)).toBe(0)
    expect(growthStageForProgress(1.5)).toBe(3)
    expect(growthStageForProgress(NaN)).toBe(0)
    expect(growthStageForProgress(undefined)).toBe(0)
  })
})

describe('sessionSeed', () => {
  it('is deterministic for a given start time', () => {
    expect(sessionSeed({ startTs: 1_700_000_000_000 })).toBe(sessionSeed({ startTs: 1_700_000_000_000 }))
    expect(sessionSeed({ startTs: 1 })).not.toBe(sessionSeed({ startTs: 2 }))
  })

  it('prefers a queued plantNext over the start time', () => {
    expect(sessionSeed({ startTs: 123, plantNext: 42 })).toBe(42)
    // A non-finite plantNext is ignored and falls back to the start time.
    expect(sessionSeed({ startTs: 123, plantNext: null })).toBe(sessionSeed({ startTs: 123 }))
  })

  it('always yields a DNA that renders (in range for decode)', () => {
    for (const startTs of [0, 1, 999, 1_700_000_000_000, 2_000_000_003_777]) {
      const dna = sessionSeed({ startTs })
      expect(Number.isFinite(dna)).toBe(true)
      const tree = generate(dna, 'mature')
      expect(tree.grid.length).toBeGreaterThan(0)
      expect(tree.palette.C).toBeTruthy()
    }
  })
})

describe('growthLabel', () => {
  it('gives warm copy for each stage, by index or name', () => {
    for (let i = 0; i < STAGES.length; i++) {
      expect(growthLabel(i)).toBe(growthLabel(STAGES[i]))
      expect(growthLabel(i).length).toBeGreaterThan(0)
    }
    expect(growthLabel('mature')).toMatch(/grown full/i)
  })

  it('falls back to the seed label for unknown input', () => {
    expect(growthLabel(99)).toBe(growthLabel('seed'))
    expect(growthLabel('bogus')).toBe(growthLabel('seed'))
  })

  it('never contains an em-dash', () => {
    for (const s of STAGES) expect(growthLabel(s)).not.toContain('—')
  })
})
