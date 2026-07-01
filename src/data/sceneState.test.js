import { describe, it, expect } from 'vitest'
import { deriveScene, SKY_RAMPS } from './sceneState.js'

describe('deriveScene — dayparts', () => {
  it('returns the named ramp for each part of day', () => {
    for (const part of ['dawn', 'day', 'dusk', 'night']) {
      const s = deriveScene({ partOfDay: part })
      expect(s.daypart).toBe(part)
      expect(s.skyRamp).toBe(SKY_RAMPS[part])
      expect(s.ambientLight).toBeGreaterThan(0)
      expect(s.ambientLight).toBeLessThanOrEqual(1)
      expect(s.ground).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('falls back to day for unknown or missing parts', () => {
    expect(deriveScene({ partOfDay: 'brunch' }).daypart).toBe('day')
    expect(deriveScene({}).daypart).toBe('day')
    expect(deriveScene().daypart).toBe('day')
  })

  it('night is dimmer than day, and its ground follows', () => {
    const day = deriveScene({ partOfDay: 'day' })
    const night = deriveScene({ partOfDay: 'night' })
    expect(night.ambientLight).toBeLessThan(day.ambientLight)
    expect(night.ground).not.toBe(day.ground)
  })
})

describe('deriveScene — weather from the mixer', () => {
  it('maps the steadyRain and thunder sliders through directly', () => {
    const s = deriveScene({ mixer: { levels: { steadyRain: 0.5, thunder: 0.2 } } })
    expect(s.weather).toEqual({ rain: 0.5, thunder: 0.2 })
  })

  it('clamps out-of-range and missing slider values', () => {
    expect(deriveScene({ mixer: { levels: { steadyRain: 1.7, thunder: -3 } } }).weather).toEqual({
      rain: 1,
      thunder: 0,
    })
    expect(deriveScene({ mixer: { levels: { steadyRain: NaN } } }).weather.rain).toBe(0)
    expect(deriveScene({ mixer: {} }).weather).toEqual({ rain: 0, thunder: 0 })
    expect(deriveScene({}).weather).toEqual({ rain: 0, thunder: 0 })
  })
})

describe('deriveScene — session warmth', () => {
  it('is zero outside a session regardless of fraction', () => {
    expect(deriveScene({ sessionFraction: 0.8 }).warmth).toBe(0)
  })

  it('tracks the clamped session fraction while active', () => {
    expect(deriveScene({ sessionActive: true, sessionFraction: 0.4 }).warmth).toBe(0.4)
    expect(deriveScene({ sessionActive: true, sessionFraction: 1.6 }).warmth).toBe(1)
    expect(deriveScene({ sessionActive: true, sessionFraction: NaN }).warmth).toBe(0)
  })
})

describe('deriveScene — purity', () => {
  it('same inputs give identical output', () => {
    const input = {
      partOfDay: 'dusk',
      mixer: { levels: { steadyRain: 0.3 } },
      sessionActive: true,
      sessionFraction: 0.5,
    }
    expect(deriveScene(input)).toEqual(deriveScene(input))
  })
})
