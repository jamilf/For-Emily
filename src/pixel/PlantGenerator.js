// PlantGenerator — procedurally builds tree variations as PixelSprite-compatible
// { grid, palette } from a single numeric DNA. Deterministic: the same DNA always
// renders the same tree, so harvested trees saved by id re-render identically.
//
// DNA decomposes into canopy shape × trunk style × surface pattern × palette,
// giving 4 × 3 × 3 × 5 = 180 distinct mature trees. Each tree renders at four
// growth stages: seed → sprout → sapling → mature.
//
// Renderer 2.0: grids are generated natively at 2x the original resolution
// (26 wide vs 13) with deterministic detail passes layered on the same geometry:
// a dark outline around each solid region, 3-step shading ramps lit from the
// upper-left, interior dither keyed to the DNA's pattern bits, and a small
// canopy-shine highlight cluster. The DNA encoding, stage enum, and variation
// count are untouched, so every existing tree keeps its identity.

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
  { main: '#DBBC7F', shade: '#9a8a3a', hi: '#FFD27D', blossom: '#FFCBA4' }, // golden — true gold canopy, deep-gold base, peach catch-light
]
export const VARIATION_COUNT = SHAPES * TRUNKS * PATTERNS * FOLIAGE.length // 180

const TRUNK = { main: '#6E4527', shade: '#5e4327' }
const SOIL = '#7a5a32'

// 2x logical resolution: 26 columns; the geometric centre sits between the two
// middle columns so canopies stay symmetric.
const W = 26
const CX = 12.5

// Character families used by the detail passes.
const CANOPY_CHARS = new Set(['C', 'c', 'd', 'o', 'h'])
const TRUNK_CHARS = new Set(['T', 't', 'R'])

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

// Derive a lighter/darker ramp tone from a hex colour (pure integer math).
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
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

// Is (x,y) inside the canopy silhouette for a given shape? (2x-scaled bounds.)
function inCanopy(shape, x, y, top, h) {
  const ry = h / 2
  const cy = top + ry
  const dx = x - CX
  switch (shape) {
    case 1: {
      // pine: stacked triangle widening downward
      const half = Math.floor(((y - top) / Math.max(1, h - 1)) * 12) + 2
      return y >= top && y <= top + h - 1 && Math.abs(dx) <= half
    }
    case 2: // tall oval
      return (dx * dx) / 64 + ((y - cy) * (y - cy)) / (ry * ry) <= 1
    case 3: // broad/wide
      return (dx * dx) / 144 + ((y - cy) * (y - cy)) / (ry * ry * 0.7) <= 1
    default: // round
      return (dx * dx) / 120 + ((y - cy) * (y - cy)) / (ry * ry) <= 1
  }
}

// Paint the canopy with a 3-step ramp lit from the upper-left, then the DNA
// pattern's texture on top (dappled checker / speckle / soft dither), then the
// occasional blossom. All randomness comes from the shared per-DNA rng.
function paintCanopy(grid, { shape, pattern, palIdx }, rng, top, h) {
  const fol = FOLIAGE[palIdx]
  const rx = shape === 3 ? 12 : shape === 2 ? 8 : 11
  for (let y = top; y < top + h; y++) {
    for (let x = 0; x < W; x++) {
      if (!inCanopy(shape, x, y, top, h)) continue
      // Light axis: 0 at the upper-left of the canopy, 1 at the lower-right.
      const lt = ((x - (CX - rx)) / (2 * rx) + (y - top) / h) / 2
      let ch = lt < 0.3 ? 'd' : lt > 0.68 ? 'c' : 'C'
      if (pattern === 1) ch = (x + y) % 2 === 0 ? ch : ch === 'd' ? 'C' : 'c' // dappled weave
      if (pattern === 2 && rng() < 0.12) ch = 'd' // speckle highlights
      if (pattern === 0 && ch === 'C' && (x + y) % 2 === 1 && rng() < 0.1) ch = 'c' // soft dither
      if (fol.blossom && rng() < 0.05) ch = 'o' // occasional blossom
      grid[y][x] = ch
    }
  }
}

function paintTrunk(grid, { trunk }, top, h) {
  const bottom = top + h
  for (let y = top; y < bottom; y++) {
    if (trunk === 1 && y < top + 4) {
      // forked at the top: two 2-wide prongs
      for (const px of [CX - 3.5, CX + 2.5]) {
        grid[y][Math.round(px - 0.5)] = 'T'
        grid[y][Math.round(px + 0.5)] = 'T'
      }
      continue
    }
    const halfW = trunk === 2 ? 4 : 2 // thick vs normal (2x-scaled)
    const left = Math.round(CX - halfW + 0.5)
    const right = Math.round(CX + halfW - 0.5)
    for (let x = left; x <= right; x++) {
      grid[y][x] = x === left ? 'R' : x > CX ? 't' : 'T' // rim light on the lit side
    }
  }
}

// Detail pass: a 1px darker outline where a solid region meets transparency.
// Canopy-family edges become 'e', trunk-family edges 'u'. Reads a frozen copy so
// the outline never cascades inward.
function outlinePass(grid) {
  const src = grid.map((row) => row.slice())
  const at = (x, y) => (src[y] && src[y][x]) || ' '
  for (let y = 0; y < src.length; y++) {
    for (let x = 0; x < W; x++) {
      const ch = src[y][x]
      if (ch === ' ' || ch === 'k') continue
      const edge =
        at(x - 1, y) === ' ' || at(x + 1, y) === ' ' || at(x, y - 1) === ' ' || at(x, y + 1) === ' '
      if (!edge) continue
      if (CANOPY_CHARS.has(ch)) grid[y][x] = 'e'
      else if (TRUNK_CHARS.has(ch)) grid[y][x] = 'u'
    }
  }
}

// Detail pass: a small deterministic canopy-shine cluster near the light source.
function highlightPass(grid, rng, { shape }, top, h) {
  const rx = shape === 3 ? 12 : shape === 2 ? 8 : 11
  const hx = CX - rx * 0.35 + (rng() - 0.5) * 2
  const hy = top + h * 0.24 + (rng() - 0.5) * 1.5
  const r = 2.2
  for (let y = Math.floor(hy - r); y <= Math.ceil(hy + r); y++) {
    for (let x = Math.floor(hx - r); x <= Math.ceil(hx + r); x++) {
      if (!grid[y] || !grid[y][x]) continue
      if (!CANOPY_CHARS.has(grid[y][x])) continue
      const d2 = (x - hx) * (x - hx) + (y - hy) * (y - hy)
      if (d2 <= r * r) grid[y][x] = d2 <= 1.2 ? 'h' : 'd'
    }
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
    grid = blankGrid(8)
    for (let x = 12; x <= 13; x++) grid[0][x] = grid[1][x] = 'C'
    for (let x = 10; x <= 15; x++) grid[2][x] = grid[3][x] = 'c'
    for (let y = 4; y <= 7; y++) for (let x = 6; x <= 19; x++) grid[y][x] = 'k'
  } else if (stage === 'sprout') {
    grid = blankGrid(14)
    for (let x = 12; x <= 13; x++) grid[2][x] = grid[3][x] = 'C'
    for (let x = 10; x <= 15; x++) grid[4][x] = grid[5][x] = 'C'
    grid[4][10] = grid[4][15] = 'd' // leaf tips catch the light
    for (let y = 6; y <= 11; y++) for (let x = 12; x <= 13; x++) grid[y][x] = 'T'
    for (let y = 12; y <= 13; y++) for (let x = 8; x <= 17; x++) grid[y][x] = 'k'
  } else if (stage === 'sapling') {
    grid = blankGrid(22)
    paintCanopy(grid, parts, rng, 0, 14)
    paintTrunk(grid, parts, 14, 8)
    highlightPass(grid, rng, parts, 0, 14)
  } else {
    grid = blankGrid(32)
    paintCanopy(grid, parts, rng, 0, 20)
    paintTrunk(grid, parts, 20, 12)
    highlightPass(grid, rng, parts, 0, 20)
  }
  outlinePass(grid)

  const palette = {
    T: TRUNK.main,
    t: TRUNK.shade,
    R: shadeHex(TRUNK.main, 1.28), // trunk rim light
    u: shadeHex(TRUNK.shade, 0.68), // trunk outline
    C: fol.main,
    c: fol.shade,
    d: fol.hi,
    h: shadeHex(fol.hi, 1.16), // canopy shine
    e: shadeHex(fol.shade, 0.62), // canopy outline
    o: fol.blossom || fol.hi,
    k: SOIL,
    // withered variant chars (used by the penalty animation overlay)
    X: '#8a7a5a',
    x: '#6b5e44',
  }

  return { grid: grid.map((row) => row.join('')), palette }
}

/** A withered version of a tree (browns), for the leave-the-tab penalty. */
export function witherPalette(palette) {
  return {
    ...palette,
    C: '#8a7a5a',
    c: '#6b5e44',
    d: '#9a8a6a',
    h: '#a59572',
    e: '#54492f',
    o: '#7a6a4a',
    T: '#5e4e34',
    t: '#4e4028',
    R: '#6e5c3e',
    u: '#3e321e',
  }
}

// Turn two unit-interval rolls into a weighted DNA: green common, golden/autumn
// rarer. Shared by the deterministic and random entry points so both draw from the
// same distribution.
function weightedDNA(baseRoll, palRoll) {
  const base = Math.floor(baseRoll * (SHAPES * TRUNKS * PATTERNS))
  let palIdx
  if (palRoll < 0.4) palIdx = 0
  else if (palRoll < 0.62) palIdx = 2
  else if (palRoll < 0.8) palIdx = 3
  else if (palRoll < 0.92) palIdx = 1
  else palIdx = 4
  return base + palIdx * SHAPES * TRUNKS * PATTERNS
}

/**
 * A valid, deterministic DNA from an integer seed, using the same weighting as
 * `randomDNA` (green common, golden/autumn rarer). Same seed always gives the same
 * tree, so a session's tree is reproducible from its start time.
 */
export function dnaFromSeed(seedInt) {
  const rng = mulberry32(Math.floor(seedInt) | 0)
  return weightedDNA(rng(), rng())
}

/** Pick a fresh DNA, lightly weighted so common greens appear more than rare palettes. */
export function randomDNA() {
  return dnaFromSeed(Math.floor(Math.random() * 2 ** 31))
}
