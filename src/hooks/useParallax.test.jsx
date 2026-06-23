import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import useParallax from './useParallax.js'

function Harness() {
  useParallax()
  return null
}

const root = document.documentElement
const get = (name) => root.style.getPropertyValue(name)
const setScroll = (v) => Object.defineProperty(window, 'scrollY', { configurable: true, get: () => v })
const scrollTarget = (v) => v / ((window.innerHeight || 1) * 1.2)

// Drive matchMedia per query so we can flip pointer support / reduced motion.
function setMatch(map) {
  window.matchMedia = (q) => ({
    matches: !!map[q],
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })
}

const origMM = window.matchMedia
const origRaf = window.requestAnimationFrame
const origCaf = window.cancelAnimationFrame

beforeEach(() => {
  // Run the eased rAF loop synchronously to completion. The loop reschedules via
  // requestAnimationFrame until it settles onto the target, so a synchronous mock
  // (that invokes the callback and returns 0) lets it converge in one call stack;
  // returning 0 leaves the rAF flag clear so the next input can kick a fresh loop.
  window.requestAnimationFrame = (cb) => {
    cb(0)
    return 0
  }
  window.cancelAnimationFrame = () => {}
})

afterEach(() => {
  window.matchMedia = origMM
  window.requestAnimationFrame = origRaf
  window.cancelAnimationFrame = origCaf
  root.style.removeProperty('--par-x')
  root.style.removeProperty('--par-y')
  root.style.removeProperty('--par-scroll')
})

describe('useParallax', () => {
  it('eases to a bounded, normalized scroll and a clamped pointer offset', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': true })
    setScroll(120)
    const { unmount } = render(<Harness />)

    window.dispatchEvent(new Event('scroll'))
    // --par-scroll is 0..1 progress, NOT raw pixels, so it can never fling a band.
    expect(parseFloat(get('--par-scroll'))).toBeCloseTo(scrollTarget(120), 3)

    // Pointer at the bottom-right corner eases to (+1, +1).
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: window.innerWidth, clientY: window.innerHeight }),
    )
    expect(parseFloat(get('--par-x'))).toBeCloseTo(1, 2)
    expect(parseFloat(get('--par-y'))).toBeCloseTo(1, 2)

    unmount()
    expect(get('--par-x')).toBe('') // cleaned up
  })

  it('clamps the scroll progress to 1 no matter how far she scrolls', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': true })
    setScroll(100000)
    render(<Harness />)
    window.dispatchEvent(new Event('scroll'))
    expect(parseFloat(get('--par-scroll'))).toBe(1)
  })

  it('does nothing under prefers-reduced-motion', () => {
    setMatch({ '(prefers-reduced-motion: reduce)': true })
    setScroll(80)
    render(<Harness />)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10 }))
    expect(get('--par-scroll')).toBe('')
    expect(get('--par-x')).toBe('')
  })

  it('only attaches pointer parallax for a fine, hovering pointer', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': false }) // touch-like
    setScroll(0)
    render(<Harness />)
    // The seed leaves --par-x at 0; a pointermove must NOT change it (no listener).
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: window.innerWidth, clientY: 5 }))
    expect(get('--par-x')).toBe('0.0000')
    // ...but scroll parallax still works on touch.
    setScroll(60)
    window.dispatchEvent(new Event('scroll'))
    expect(parseFloat(get('--par-scroll'))).toBeCloseTo(scrollTarget(60), 3)
  })

  it('detaches listeners on unmount', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': true })
    const { unmount } = render(<Harness />)
    unmount()
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }))
    expect(get('--par-x')).toBe('')
  })
})
