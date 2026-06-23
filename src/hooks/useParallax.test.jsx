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
  // Run scheduled frames synchronously so assertions don't wait on rAF. Return 0:
  // apply() runs inside this call and resets the rAF flag to 0, so the handle we
  // return must not leave a truthy flag behind (which would coalesce away every
  // later event). A real rAF assigns its handle before the deferred frame runs.
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
  it('publishes pointer + scroll depth vars on <html>', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': true })
    setScroll(120)
    const { unmount } = render(<Harness />)

    window.dispatchEvent(new Event('scroll'))
    expect(get('--par-scroll')).toBe('120.0')

    // Pointer at the bottom-right corner maps to roughly (+1, +1).
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: window.innerWidth, clientY: window.innerHeight }),
    )
    expect(parseFloat(get('--par-x'))).toBeCloseTo(1, 1)
    expect(parseFloat(get('--par-y'))).toBeCloseTo(1, 1)

    unmount()
    expect(get('--par-x')).toBe('') // cleaned up
  })

  it('does nothing under prefers-reduced-motion', () => {
    setMatch({ '(prefers-reduced-motion: reduce)': true })
    setScroll(80)
    render(<Harness />)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10 }))
    expect(get('--par-scroll')).toBe('') // no listeners, no vars
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
    setScroll(42)
    window.dispatchEvent(new Event('scroll'))
    expect(get('--par-scroll')).toBe('42.0')
  })

  it('detaches listeners on unmount', () => {
    setMatch({ '(hover: hover) and (pointer: fine)': true })
    const { unmount } = render(<Harness />)
    unmount()
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }))
    expect(get('--par-x')).toBe('')
  })
})
