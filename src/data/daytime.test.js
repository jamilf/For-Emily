import { describe, it, expect } from 'vitest'
import { timeOfDay, DAWN_START, DAY_START, DUSK_START, NIGHT_START } from './daytime.js'

const at = (h) => new Date(2026, 5, 10, h, 0)

describe('timeOfDay', () => {
  it('maps each local hour to a part of day', () => {
    expect(timeOfDay(at(0))).toBe('night')
    expect(timeOfDay(at(4))).toBe('night')
    expect(timeOfDay(at(5))).toBe('dawn')
    expect(timeOfDay(at(7))).toBe('dawn')
    expect(timeOfDay(at(8))).toBe('day')
    expect(timeOfDay(at(12))).toBe('day')
    expect(timeOfDay(at(16))).toBe('day')
    expect(timeOfDay(at(17))).toBe('dusk')
    expect(timeOfDay(at(19))).toBe('dusk')
    expect(timeOfDay(at(20))).toBe('night')
    expect(timeOfDay(at(23))).toBe('night')
  })

  it('switches exactly at each boundary', () => {
    expect(timeOfDay(at(DAWN_START))).toBe('dawn')
    expect(timeOfDay(at(DAWN_START - 1))).toBe('night')
    expect(timeOfDay(at(DAY_START))).toBe('day')
    expect(timeOfDay(at(DUSK_START))).toBe('dusk')
    expect(timeOfDay(at(NIGHT_START))).toBe('night')
  })

  it('defaults to now without throwing', () => {
    expect(['dawn', 'day', 'dusk', 'night']).toContain(timeOfDay())
  })
})
