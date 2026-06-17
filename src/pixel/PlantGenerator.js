// PlantGenerator — procedurally builds tree variations as PixelSprite-compatible
// { grid, palette } from a single numeric DNA. Deterministic: the same DNA always
// renders the same tree, so harvested trees saved by id re-render identically.
//
// DNA decomposes into canopy shape × trunk style × surface pattern × palette,
// giving 4 × 3 × 3 × 5 = 180 distinct mature trees (well over the 50 required).
// Each tree can render at four growth stages: seed → sprout → sapling → mature.

export const STAGES = ['seed', 'sprout', 'sapling', 'mature']

const SHAPES = 4
const TRUNKS = 3
const PATTERNS = 3

// Foliage palettes (hexes drawn from the app's existing token values).
const FOLIAGE = [
  { main: '#6f8c4f', shade: '#4f6a3a', hi: '#A7C080', blossom: null }, // forest green
  { main: '#E69875', shade: '#b85c3c', hi: '#F9A857', blossom: '#E67E80' }, // autumn
  { main: '#7a9a5a', shade: '#52723a', hi: '#A7C080', blossom: '#F4A6C0' }, // blossom
  { main: '#3FB0AC', shade: '#2c7d7a', hi: '#83C092', blossom: null }, // teal
  { main: '#9a8a3a', shade: '#6f6328', hi: '#FFD27D', blossom: '#DBBC7F' }, // golden
]
export const VARIATION_COUNT = SHAPES * TRUNKS * PATTERNS * FOLIAGE.length // 180

const TRUNK = { main: '#6E4527', shade: '#5e4327' }
const SOIL = '#7a5a32'

const W = 13
const CX = 6

// Tiny seeded PRNG so speckle/blossom placement is deterministic per DNA.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function decode(dna) {
  const n = Math.abs(Math.floor(dna))
  return {
    shape: n % SHAPES,
    trunk: Math.floor(n / SHAPES) % TRUNKS,
    pattern: Math.floor(n / (SHAPES * TRUNKS)) % PATTERNS,
    palIdx: Math.floor(n / (SHAPES * TRUNKS * PATTERNS)) % FOLIAGE.length,
  }
}

function blankGrid(h) {
  return Array.from({ length: h }, () => Array.from({ length: W }, () => ' '))
}

// Is (x,y) inside the canopy silhouette for a given shape?
function inCanopy(shape, x, y, top, h) {
  const ry = h / 2
  const cy = top + ry
  const dx = x - CX
  switch (shape) {
    case 1: {
      // pine: stacked triangle widening downward
      const half = Math.floor(((y - top) / Math.max(1, h - 1)) * 6) + 1
      return y >= top && y <= top + h - 1 && Math.abs(dx) <= half
    }
    case 2: // tall oval
      return (dx * dx) / 16 + ((y - cy) * (y - cy)) / (ry * ry) <= 1
    case 3: // broad/wide
      return (dx * dx) / 36 + ((y - cy) * (y - cy)) / (ry * ry * 0.7) <= 1
    default: // round
      return (dx * dx) / 30 + ((y - cy) * (y - cy)) / (ry * ry) <= 1
  }
}

function paintCanopy(grid, { shape, pattern, palIdx }, rng, top, h) {
  const fol = FOLIAGE[palIdx]
  for (let y = top; y < top + h; y++) {
    for (let x = 0; x < W; x++) {
      if (!inCanopy(shape, x, y, top, h)) continue
      let ch = 'C'
      if (pattern === 1) ch = (x + y) % 2 === 0 ? 'C' : 'c' // dappled
      else if (y > top + h * 0.6) ch = 'c' // base shading on solid/speckled
      if (pattern === 2 && rng() < 0.16) ch = 'd' // speckle highlights
      if (fol.blossom && rng() < 0.07) ch = 'o' // occasional blossom
      grid[y][x] = ch
    }
  }
}

function paintTrunk(grid, { trunk }, top, h) {
  const bottom = top + h
  for (let y = top; y < bottom; y++) {
    if (trunk === 1 && y < top + 2) {
      // forked at the top
      grid[y][CX - 1] = 'T'
      grid[y][CX + 1] = 'T'
      continue
    }
    const halfW = trunk === 2 ? 2 : 1 // thick vs normal
    for (let x = CX - halfW; x <= CX + halfW; x++) grid[y][x] = x > CX ? 't' : 'T'
  }
}

/**
 * Build a tree at a growth stage.
 * @param {number} dna   numeric variation id
 * @param {('seed'|'sprout'|'sapling'|'mature')} stage
 * @returns {{ grid: string[], palette: Object }}
 */
export function generate(dna, stage = 'mature') {
  const parts = decode(dna)
  const fol = FOLIAGE[parts.palIdx]
  const rng = mulberry32((Math.abs(Math.floor(dna)) + 1) * 2654435761)

  let grid
  if (stage === 'seed') {
    grid = blankGrid(4)
    grid[0][CX] = 'C'
    for (let x = CX - 1; x <= CX + 1; x++) grid[1][x] = 'c'
    for (let x = CX - 3; x <= CX + 3; x++) grid[2][x] = grid[3][x] = 'k'
  } else if (stage === 'sprout') {
    grid = blankGrid(7)
    for (let y = 3; y < 6; y++) grid[y][CX] = 'T'
    grid[1][CX] = grid[2][CX] = 'C'
    grid[2][CX - 1] = grid[2][CX + 1] = 'C'
    for (let x = CX - 2; x <= CX + 2; x++) grid[6][x] = 'k'
  } else if (stage === 'sapling') {
    grid = blankGrid(11)
    paintCanopy(grid, parts, rng, 0, 7)
    paintTrunk(grid, parts, 7, 4)
  } else {
    grid = blankGrid(16)
    paintCanopy(grid, parts, rng, 0, 10)
    paintTrunk(grid, parts, 10, 6)
  }

  const palette = {
    T: TRUNK.main,
    t: TRUNK.shade,
    C: fol.main,
    c: fol.shade,
    d: fol.hi,
    o: fol.blossom || fol.hi,
    k: SOIL,
    // withered variant chars (used by the penalty animation overlay)
    X: '#8a7a5a',
    x: '#6b5e44',
  }

  return { grid: grid.map((row) => row.join('')), palette }
}

/** Map a focus-progress fraction (0..1) to a growth stage index. */
export function stageForProgress(fraction) {
  if (fraction >= 1) return 3
  if (fraction >= 0.66) return 2
  if (fraction >= 0.33) return 1
  return 0
}

/** A withered version of a tree (browns), for the leave-the-tab penalty. */
export function witherPalette(palette) {
  return { ...palette, C: '#8a7a5a', c: '#6b5e44', d: '#9a8a6a', o: '#7a6a4a', T: '#5e4e34', t: '#4e4028' }
}

/** Pick a fresh DNA, lightly weighted so common greens appear more than rare palettes. */
export function randomDNA() {
  const base = Math.floor(Math.random() * (SHAPES * TRUNKS * PATTERNS))
  // weight palette: green common, golden/autumn rarer
  const r = Math.random()
  let palIdx
  if (r < 0.4) palIdx = 0
  else if (r < 0.62) palIdx = 2
  else if (r < 0.8) palIdx = 3
  else if (r < 0.92) palIdx = 1
  else palIdx = 4
  return base + palIdx * SHAPES * TRUNKS * PATTERNS
}
