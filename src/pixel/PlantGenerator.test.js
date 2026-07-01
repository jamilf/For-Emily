import { describe, it, expect } from 'vitest'
import { generate, witherPalette, dnaFromSeed, randomDNA, STAGES, VARIATION_COUNT } from './PlantGenerator.js'
import { gridToRects } from './gridRects.js'

// A spread of DNA values across the full 0..179 range (every palette family).
const SAMPLE_DNAS = [0, 7, 23, 41, 59, 76, 94, 112, 131, 150, 168, 179]

describe('PlantGenerator — determinism (Renderer 2.0)', () => {
  it('same dna + stage always yields an identical grid, palette, and rect list', () => {
    for (const dna of SAMPLE_DNAS) {
      for (const stage of STAGES) {
        const a = generate(dna, stage)
        const b = generate(dna, stage)
        expect(a).toEqual(b)
        expect(gridToRects(a.grid, a.palette)).toEqual(gridToRects(b.grid, b.palette))
      }
    }
  })

  it('distinct DNAs produce distinct mature trees', () => {
    const seen = new Set(SAMPLE_DNAS.map((dna) => JSON.stringify(generate(dna, 'mature').grid)))
    expect(seen.size).toBe(SAMPLE_DNAS.length)
  })
})

describe('PlantGenerator — stage parity across the DNA range', () => {
  it('every stage renders a non-empty sprite at the 2x resolution', () => {
    for (const dna of SAMPLE_DNAS) {
      for (const stage of STAGES) {
        const { grid, palette } = generate(dna, stage)
        expect(grid.length).toBeGreaterThan(0)
        expect(new Set(grid.map((r) => r.length)).size).toBe(1) // rectangular
        expect(grid[0].length).toBe(26) // native 2x width
        const rects = gridToRects(grid, palette)
        expect(rects.length).toBeGreaterThan(0)
      }
    }
  })

  it('a mature tree run-length merges into the low hundreds of rects', () => {
    for (const dna of SAMPLE_DNAS) {
      const { grid, palette } = generate(dna, 'mature')
      const n = gridToRects(grid, palette).length
      expect(n).toBeGreaterThan(30)
      expect(n).toBeLessThan(450)
    }
  })

  it('keeps the classic palette keys and adds the detail-pass tones', () => {
    const { palette } = generate(5, 'mature')
    for (const key of ['T', 't', 'C', 'c', 'd', 'o', 'k']) expect(palette[key]).toBeTruthy()
    for (const key of ['e', 'u', 'h', 'R']) expect(palette[key]).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('locked-style single-tone recolouring still covers every palette key', () => {
    // The Almanac's lockedPalette maps every key; the withered palette must too.
    const { palette } = generate(41, 'mature')
    const withered = witherPalette(palette)
    for (const key of Object.keys(palette)) expect(withered[key]).toBeTruthy()
    expect(withered.C).not.toBe(palette.C)
  })
})

describe('PlantGenerator — DNA encoding unchanged', () => {
  it('VARIATION_COUNT and the stage enum are untouched', () => {
    expect(VARIATION_COUNT).toBe(180)
    expect(STAGES).toEqual(['seed', 'sprout', 'sapling', 'mature'])
  })

  it('dnaFromSeed is deterministic and in range; randomDNA is in range', () => {
    expect(dnaFromSeed(12345)).toBe(dnaFromSeed(12345))
    for (const seed of [0, 1, 999, 2 ** 30]) {
      const dna = dnaFromSeed(seed)
      expect(dna).toBeGreaterThanOrEqual(0)
      expect(dna).toBeLessThan(VARIATION_COUNT)
    }
    for (let i = 0; i < 20; i++) {
      const dna = randomDNA()
      expect(dna).toBeGreaterThanOrEqual(0)
      expect(dna).toBeLessThan(VARIATION_COUNT)
    }
  })
})
