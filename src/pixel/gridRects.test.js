import { describe, it, expect } from 'vitest'
import { gridToRects, gridSize } from './gridRects.js'

const PAL = { A: '#aaa', B: '#bbb' }

describe('gridSize', () => {
  it('returns the bounding cols/rows, tolerating ragged rows', () => {
    expect(gridSize(['AA', 'AAAA', 'A'])).toEqual({ cols: 4, rows: 3 })
    expect(gridSize([])).toEqual({ cols: 0, rows: 0 })
  })
})

describe('gridToRects — run-length merging', () => {
  it('merges a solid row into one rect', () => {
    expect(gridToRects(['AAAA'], PAL)).toEqual([{ x: 0, y: 0, w: 4, h: 1, fill: '#aaa' }])
  })

  it('splits runs at colour changes and keeps row-local coordinates', () => {
    expect(gridToRects(['AABBA'], PAL)).toEqual([
      { x: 0, y: 0, w: 2, h: 1, fill: '#aaa' },
      { x: 2, y: 0, w: 2, h: 1, fill: '#bbb' },
      { x: 4, y: 0, w: 1, h: 1, fill: '#aaa' },
    ])
  })

  it('treats unmapped chars (and spaces) as transparent gaps that break runs', () => {
    expect(gridToRects(['A A', 'AzA'], PAL)).toEqual([
      { x: 0, y: 0, w: 1, h: 1, fill: '#aaa' },
      { x: 2, y: 0, w: 1, h: 1, fill: '#aaa' },
      { x: 0, y: 1, w: 1, h: 1, fill: '#aaa' },
      { x: 2, y: 1, w: 1, h: 1, fill: '#aaa' },
    ])
  })

  it('handles single-pixel runs, trailing runs, and multiple rows', () => {
    expect(gridToRects(['B', ' B'], PAL)).toEqual([
      { x: 0, y: 0, w: 1, h: 1, fill: '#bbb' },
      { x: 1, y: 1, w: 1, h: 1, fill: '#bbb' },
    ])
  })

  it('two different chars mapped to the SAME colour still merge (colour-keyed runs)', () => {
    expect(gridToRects(['AB'], { A: '#same', B: '#same' })).toEqual([
      { x: 0, y: 0, w: 2, h: 1, fill: '#same' },
    ])
  })

  it('is pure and deterministic', () => {
    const grid = ['AAB', 'B A']
    expect(gridToRects(grid, PAL)).toEqual(gridToRects(grid, PAL))
    expect(gridToRects([], PAL)).toEqual([])
    expect(gridToRects(['AA'], {})).toEqual([])
  })
})
