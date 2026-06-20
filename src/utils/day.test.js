import { describe, it, expect, afterEach, vi } from 'vitest'
import { dayStr, yesterdayStr } from './day.js'

afterEach(() => vi.useRealTimers())

describe('dayStr', () => {
  it('formats a date as UTC YYYY-MM-DD', () => {
    expect(dayStr(new Date('2026-06-19T23:30:00Z'))).toBe('2026-06-19')
    expect(dayStr(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01')
  })
  it('defaults to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    expect(dayStr()).toBe('2026-03-15')
  })
})

describe('yesterdayStr', () => {
  it('is the UTC day before today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    expect(yesterdayStr()).toBe('2026-03-14')
  })
  it('handles month boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T06:00:00Z'))
    expect(yesterdayStr()).toBe('2026-03-31')
  })
})
