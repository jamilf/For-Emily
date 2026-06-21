import { describe, it, expect } from 'vitest'
import { CONSTELLATIONS, constellationMetrics, buildSky } from './constellations.js'

// A garden entry at a given local hour.
const at = (hour, n = 1) =>
  Array.from({ length: n }, () => ({ id: 0, ts: new Date(2026, 5, 18, hour, 0).getTime() }))

describe('constellationMetrics', () => {
  it('counts sessions, mornings (<12) and nights (>=20 || <5) by local hour', () => {
    const garden = [...at(9, 3), ...at(11, 1), ...at(21, 2), ...at(2, 1), ...at(15, 1)]
    const m = constellationMetrics({ garden })
    expect(m.sessions).toBe(8)
    expect(m.mornings).toBe(5) // 9,9,9,11,2 (2am is < 12)
    expect(m.nights).toBe(3) // 21,21,2
  })

  it('counts active days, reviews, reflections, memories, and spirits', () => {
    const m = constellationMetrics({
      focusLog: {
        '2026-06-18': { sessions: 2 },
        '2026-06-19': { sessions: 0 },
        '2026-06-20': { sessions: 1 },
      },
      flashcardStats: { total: 120 },
      reflections: [{}, {}, {}],
      memories: [{}, {}],
      spirits: { unlocked: { curiosity: true, dawn: true } },
    })
    expect(m.days).toBe(2) // only days with sessions > 0
    expect(m).toMatchObject({ reviews: 120, reflections: 3, memories: 2, spirits: 2 })
  })

  it('is safe on empty input', () => {
    expect(constellationMetrics({})).toMatchObject({ sessions: 0, days: 0, mornings: 0, nights: 0 })
    expect(constellationMetrics()).toBeTruthy()
  })
})

describe('buildSky', () => {
  it('returns one entry per catalogued constellation', () => {
    expect(buildSky(constellationMetrics({}))).toHaveLength(CONSTELLATIONS.length)
  })

  it('forms a constellation exactly at its threshold (10 sessions → The Lantern)', () => {
    const nine = buildSky(constellationMetrics({ garden: at(13, 9) })).find((c) => c.id === 'lantern')
    expect(nine.formed).toBe(false)
    const ten = buildSky(constellationMetrics({ garden: at(13, 10) })).find((c) => c.id === 'lantern')
    expect(ten.formed).toBe(true)
    expect(ten.litStars).toBe(ten.stars.length)
  })

  it('lights stars in proportion to progress, clamped to the star count', () => {
    // The Lantern has 5 stars and needs 10 sessions → 5 sessions ≈ half lit.
    const lantern = buildSky(constellationMetrics({ garden: at(13, 5) })).find((c) => c.id === 'lantern')
    expect(lantern.formed).toBe(false)
    expect(lantern.litStars).toBe(Math.round((5 / 10) * lantern.stars.length))
    expect(lantern.litStars).toBeLessThanOrEqual(lantern.stars.length)
  })

  it('leaves everything dark for a brand-new user', () => {
    const sky = buildSky(constellationMetrics({}))
    expect(sky.every((c) => c.litStars === 0 && !c.formed)).toBe(true)
  })
})
