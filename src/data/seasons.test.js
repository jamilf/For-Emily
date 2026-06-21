import { describe, it, expect } from 'vitest'
import { SEASONS, SEASON_THRESHOLDS, seasonForHarvest, seasonProgress } from './seasons.js'

describe('seasonForHarvest — threshold mapping (boundary-correct)', () => {
  it('maps total harvested trees to the right season at the gentle thresholds', () => {
    expect(seasonForHarvest(0).id).toBe('spring')
    expect(seasonForHarvest(7).id).toBe('spring')
    expect(seasonForHarvest(8).id).toBe('summer') // boundary: reaching advances
    expect(seasonForHarvest(19).id).toBe('summer')
    expect(seasonForHarvest(20).id).toBe('autumn') // boundary
    expect(seasonForHarvest(39).id).toBe('autumn')
    expect(seasonForHarvest(40).id).toBe('winter') // boundary
    expect(seasonForHarvest(100).id).toBe('winter')
  })

  it('uses the single SEASON_THRESHOLDS constant as the source of truth', () => {
    expect(SEASON_THRESHOLDS).toEqual({ summer: 8, autumn: 20, winter: 40 })
    expect(seasonForHarvest(SEASON_THRESHOLDS.summer).id).toBe('summer')
    expect(seasonForHarvest(SEASON_THRESHOLDS.autumn).id).toBe('autumn')
    expect(seasonForHarvest(SEASON_THRESHOLDS.winter).id).toBe('winter')
  })

  it('defaults to Spring for empty / invalid input', () => {
    expect(seasonForHarvest().id).toBe('spring')
    expect(seasonForHarvest(NaN).id).toBe('spring')
    expect(seasonForHarvest(-5).id).toBe('spring')
  })
})

describe('seasonProgress', () => {
  it('reports trees remaining until the next season', () => {
    expect(seasonProgress(0)).toMatchObject({ remaining: 8, target: 8 })
    expect(seasonProgress(6).remaining).toBe(2) // 2 more until Summer
    expect(seasonProgress(8)).toMatchObject({ remaining: 12, target: 20 }) // Summer → Autumn
  })

  it('has no next season in Winter', () => {
    const p = seasonProgress(50)
    expect(p.season.id).toBe('winter')
    expect(p.next).toBeNull()
    expect(p.remaining).toBe(0)
    expect(p.target).toBeNull()
  })
})

describe('accessibility / contrast guarantees', () => {
  it('conveys every season by a distinct NAME (not colour alone)', () => {
    const names = SEASONS.map((s) => s.name)
    expect(names).toEqual(['Spring', 'Summer', 'Autumn', 'Winter'])
    expect(new Set(names).size).toBe(4)
    SEASONS.forEach((s) => expect(typeof s.name).toBe('string'))
  })

  it('keeps every tint subtle so it can sit behind text without harming contrast', () => {
    for (const s of SEASONS) {
      const alpha = Number(s.tint.match(/[\d.]+\)$/)[0].replace(')', ''))
      expect(alpha).toBeLessThanOrEqual(0.14)
    }
  })
})
