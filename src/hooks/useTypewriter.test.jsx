import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useTypewriter from './useTypewriter.js'

afterEach(() => {
  vi.useRealTimers()
})

describe('useTypewriter', () => {
  it('reveals everything immediately when instant (reduced motion / minimal)', () => {
    const { result } = renderHook(() => useTypewriter('hello world', { instant: true }))
    expect(result.current.shown).toBe('hello world')
    expect(result.current.done).toBe(true)
  })

  it('reveals everything immediately when the typewriter is disabled', () => {
    const { result } = renderHook(() => useTypewriter('abc', { enabled: false }))
    expect(result.current.shown).toBe('abc')
    expect(result.current.done).toBe(true)
  })

  it('crawls character by character when enabled, then completes', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTypewriter('abcd', { enabled: true, cps: 100 }))
    expect(result.current.shown).toBe('')
    expect(result.current.done).toBe(false)
    act(() => vi.advanceTimersByTime(10)) // ~1 char at 100cps
    expect(result.current.shown.length).toBeGreaterThanOrEqual(1)
    act(() => vi.advanceTimersByTime(100)) // finish
    expect(result.current.shown).toBe('abcd')
    expect(result.current.done).toBe(true)
  })

  it('skip() completes the reveal instantly', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTypewriter('long text here', { enabled: true, cps: 10 }))
    expect(result.current.done).toBe(false)
    act(() => result.current.skip())
    expect(result.current.shown).toBe('long text here')
    expect(result.current.done).toBe(true)
  })

  it('treats empty text as done', () => {
    const { result } = renderHook(() => useTypewriter('', { enabled: true }))
    expect(result.current.done).toBe(true)
  })
})
