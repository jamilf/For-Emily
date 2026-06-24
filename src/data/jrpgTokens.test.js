import { describe, it, expect } from 'vitest'
import { TOKENS, relativeLuminance, contrastRatio, meetsAA, CONTRAST_PAIRS } from './jrpgTokens.js'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5)
  })
  it('accepts shorthand hex', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#ffffff'), 6)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white and order-independent', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#2A2342', '#2A2342')).toBeCloseTo(1, 5)
  })
})

describe('meetsAA', () => {
  it('applies 4.5 for normal text and 3 for large/UI', () => {
    // ever-yellow on the dark window: a mid pair to exercise both thresholds.
    expect(meetsAA('#FDF6E3', '#2A2342')).toBe(true)
    expect(meetsAA('#2A2342', '#15112A')).toBe(false) // too close for normal text
    expect(meetsAA('#FFD27D', '#2A2342', true)).toBe(true)
  })
})

describe('JRPG token palette meets WCAG AA everywhere it is rendered', () => {
  for (const pair of CONTRAST_PAIRS) {
    it(`${pair.name} meets AA (${pair.large ? '3:1 large/UI' : '4.5:1 text'})`, () => {
      const ratio = contrastRatio(pair.fg, pair.bg)
      const need = pair.large ? 3 : 4.5
      expect(ratio, `${pair.name} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(need)
    })
  }

  it('every CONTRAST_PAIR references real token values', () => {
    const values = new Set(Object.values(TOKENS))
    for (const pair of CONTRAST_PAIRS) {
      expect(values.has(pair.fg)).toBe(true)
      expect(values.has(pair.bg)).toBe(true)
    }
  })
})
