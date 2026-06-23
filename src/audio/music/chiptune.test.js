import { describe, it, expect } from 'vitest'
import { pulseCoeffs, dutyOf } from './chiptune.js'

describe('pulseCoeffs — band-limited duty-cycle pulse spectrum', () => {
  it('returns real/imag arrays of length partials + 1, with no DC and no imaginary part', () => {
    const { real, imag } = pulseCoeffs(0.25, 24)
    expect(real).toBeInstanceOf(Float32Array)
    expect(imag).toBeInstanceOf(Float32Array)
    expect(real.length).toBe(25)
    expect(imag.length).toBe(25)
    expect(real[0]).toBe(0) // DC kept at 0 so the wave carries no offset
    for (const v of imag) expect(v).toBe(0) // pure cosine series
  })

  it('a 50% duty pulse is a square wave: only odd harmonics survive', () => {
    const { real } = pulseCoeffs(0.5, 16)
    for (let k = 1; k <= 16; k++) {
      if (k % 2 === 0) expect(Math.abs(real[k])).toBeLessThan(1e-6)
      else expect(Math.abs(real[k])).toBeGreaterThan(0)
    }
  })

  it('matches the closed form real[n] = (2/(nπ))·sin(nπ·d)', () => {
    const d = 0.125
    const { real } = pulseCoeffs(d, 8)
    for (let k = 1; k <= 8; k++) {
      const expected = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d)
      expect(real[k]).toBeCloseTo(expected, 6)
    }
  })

  it('is deterministic — identical inputs yield identical coefficients', () => {
    expect(Array.from(pulseCoeffs(0.25, 12).real)).toEqual(Array.from(pulseCoeffs(0.25, 12).real))
  })

  it('clamps degenerate duty and partials instead of producing NaN/empty output', () => {
    const a = pulseCoeffs(0, 0)
    expect(a.real.length).toBe(2) // partials floored to at least 1
    for (const v of a.real) expect(Number.isFinite(v)).toBe(true)
    const b = pulseCoeffs(1, 4)
    for (const v of b.real) expect(Number.isFinite(v)).toBe(true)
  })
})

describe('dutyOf — voice name to duty fraction', () => {
  it('maps the three pulse voices', () => {
    expect(dutyOf('pulse12')).toBeCloseTo(0.125)
    expect(dutyOf('pulse25')).toBeCloseTo(0.25)
    expect(dutyOf('pulse50')).toBeCloseTo(0.5)
  })

  it('returns null for non-pulse voices', () => {
    for (const v of ['tri', 'noise', 'piano', 'pad', 'bass', undefined]) {
      expect(dutyOf(v)).toBeNull()
    }
  })
})
