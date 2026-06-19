import { describe, it, expect } from 'vitest'
import { endsAtFrom, remainingSeconds, formatClock } from './timer.js'

describe('endsAtFrom', () => {
  it('projects a deadline from the remaining seconds', () => {
    expect(endsAtFrom(25 * 60, 1000)).toBe(1000 + 25 * 60 * 1000)
  })
})

describe('remainingSeconds — backgrounding resilience', () => {
  it('returns null when no countdown is active', () => {
    expect(remainingSeconds(null)).toBeNull()
    expect(remainingSeconds(undefined)).toBeNull()
  })

  it('derives the remaining time from the wall clock', () => {
    const endsAt = 100_000
    expect(remainingSeconds(endsAt, 100_000 - 25 * 60 * 1000)).toBe(25 * 60)
    expect(remainingSeconds(endsAt, 100_000 - 90_000)).toBe(90)
  })

  it('clamps to zero once the deadline has passed (e.g. tab was backgrounded)', () => {
    expect(remainingSeconds(100_000, 100_000)).toBe(0)
    expect(remainingSeconds(100_000, 999_999_999)).toBe(0)
  })

  it('rounds to the nearest second', () => {
    expect(remainingSeconds(10_400, 0)).toBe(10) // 10.4s → 10
    expect(remainingSeconds(10_600, 0)).toBe(11) // 10.6s → 11
  })
})

describe('formatClock', () => {
  it('formats MM:SS with zero-padding', () => {
    expect(formatClock(25 * 60)).toBe('25:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(0)).toBe('00:00')
  })
  it('never renders negative time', () => {
    expect(formatClock(-5)).toBe('00:00')
  })
})
