import { describe, it, expect } from 'vitest'
import { generate, PALETTE_KEYS } from './SpiritGenerator.js'
import { SPIRITS } from '../data/spirits.js'

describe('SpiritGenerator', () => {
  it('is deterministic — same seed + palette yields an identical sprite', () => {
    expect(generate(8, 'blue')).toEqual(generate(8, 'blue'))
    expect(JSON.stringify(generate(3, 'gold'))).toBe(JSON.stringify(generate(3, 'gold')))
  })

  it('produces a PixelSprite-compatible { grid, palette }', () => {
    const { grid, palette } = generate(1, 'rose')
    expect(Array.isArray(grid)).toBe(true)
    // Every row is the same width (square-ish creature canvas).
    const widths = new Set(grid.map((r) => r.length))
    expect(widths.size).toBe(1)
    // Palette maps the glyphs the grid actually uses.
    expect(palette).toHaveProperty('B')
    expect(palette).toHaveProperty('E')
  })

  it('renders every catalogue spirit as a visually distinct sprite', () => {
    const seen = new Set()
    for (const s of SPIRITS) {
      const key = JSON.stringify(generate(s.seed, s.paletteKey))
      expect(seen.has(key)).toBe(false) // no two spirits collide
      seen.add(key)
    }
  })

  it('falls back to a valid palette for an unknown key', () => {
    const { palette } = generate(0, 'not-a-real-palette')
    expect(typeof palette.B).toBe('string')
    expect(PALETTE_KEYS.length).toBeGreaterThan(0)
  })
})
