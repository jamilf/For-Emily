// Vitest global setup: Testing Library matchers, axe a11y matchers, and a clean
// localStorage + timer slate between tests so persisted-state tests don't leak.
import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

afterEach(() => {
  cleanup()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
  vi.clearAllTimers()
  vi.useRealTimers()
})

// jsdom doesn't implement <canvas>.getContext; stub a no-op 2D context so
// canvas-driven components (WeatherCanvas/WeatherEngine) mount without the noisy
// "Not implemented" console error that the suite treats as a failure.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({
    canvas: { width: 0, height: 0 },
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    setTransform: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
  })
}

// jsdom doesn't implement matchMedia; provide a minimal, listener-friendly stub
// so components that read prefers-reduced-motion (WeatherCanvas, etc.) render.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
