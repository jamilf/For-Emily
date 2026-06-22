// SpiritGenerator — procedurally builds Forest Spirit companions as PixelSprite-
// compatible { grid, palette } from a numeric seed + a palette key. Deterministic:
// the same (seed, paletteKey) always renders the same spirit.
//
// This is a NEW generator that reuses the shared pixel primitive (PixelSprite) and
// mirrors PlantGenerator's seeded-RNG + decode approach — it does NOT fork the tree
// art. A seed decodes into body silhouette × ear style × accent, giving distinct
// little creatures; the palette is drawn entirely from existing design tokens.

const W = 13
const CX = 6
const H = 13

// Spirit palettes — every hex is an existing app token (ever.* / sunset.* / base).
// Each palette is tuned to the one spirit that wears it (main body · base shade ·
// glow accent), so colour + accent texture read its name at a glance.
const PALETTES = {
  aqua: { main: '#83C092', shade: '#3FB0AC', hi: '#7FBBB3' }, // Reflection — still water: aqua surface, teal depth, cool blue glint
  green: { main: '#A7C080', shade: '#6f8c4f', hi: '#DBBC7F' }, // Persistence — an evergreen sprout catching a little gold light
  gold: { main: '#DBBC7F', shade: '#E69875', hi: '#FFD27D' }, // Curiosity — a warm golden spark over a glowing ember base
  purple: { main: '#5C3A6E', shade: '#352A52', hi: '#D699B6' }, // Scholar — inky violet with lavender flecks, like margin notes
  blue: { main: '#5A4A78', shade: '#352A52', hi: '#7FBBB3' }, // Night Owl — slate feathers, deep-indigo night, a moonlit edge
  rose: { main: '#E0719C', shade: '#9B3D73', hi: '#FFCBA4' }, // Dawn — sunrise rose into magenta, with a peach morning glow
}
export const PALETTE_KEYS = Object.keys(PALETTES)
const DEFAULT_PALETTE = 'green'
const EYE = '#232A2E' // bgDim — dark, AA-legible
const GLINT = '#FDF6E3' // cream — a tiny eye highlight

// Tiny seeded PRNG (same algorithm PlantGenerator uses) so accents are deterministic.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function decode(seed) {
  const n = Math.abs(Math.floor(seed))
  return {
    body: n % 3, // 0 round · 1 tall · 2 wide
    ears: Math.floor(n / 3) % 3, // 0 tuft · 1 pointed ears · 2 antennae
    accent: Math.floor(n / 9) % 2, // 0 belly patch · 1 speckles
  }
}

function blankGrid(h) {
  return Array.from({ length: h }, () => Array.from({ length: W }, () => ' '))
}

// Is (x,y) inside the body silhouette for a given body shape?
function inBody(body, x, y, top, h) {
  const ry = h / 2
  const cy = top + ry
  const dx = x - CX
  const dy = y - cy
  switch (body) {
    case 1: // tall / narrow
      return (dx * dx) / 10 + (dy * dy) / (ry * ry) <= 1
    case 2: // wide / chubby
      return (dx * dx) / 32 + (dy * dy) / (ry * ry * 0.82) <= 1
    default: // round
      return (dx * dx) / 20 + (dy * dy) / (ry * ry) <= 1
  }
}

/**
 * Build a spirit sprite.
 * @param {number} seed         numeric seed (fixed per spirit in the catalogue)
 * @param {string} paletteKey   one of PALETTE_KEYS
 * @returns {{ grid: string[], palette: Object }}
 */
export function generate(seed = 0, paletteKey = DEFAULT_PALETTE) {
  const parts = decode(seed)
  const rng = mulberry32((Math.abs(Math.floor(seed)) + 1) * 2654435761)
  const grid = blankGrid(H)
  const top = 3
  const h = 9 // body occupies rows 3..11

  // Body
  for (let y = top; y < top + h; y++) {
    for (let x = 0; x < W; x++) {
      if (!inBody(parts.body, x, y, top, h)) continue
      grid[y][x] = y > top + h * 0.62 ? 'b' : 'B' // shade toward the base
    }
  }

  // Ears / antennae crowning the head
  if (parts.ears === 1) {
    grid[top - 2][CX - 3] = grid[top - 1][CX - 3] = 'B'
    grid[top - 2][CX + 3] = grid[top - 1][CX + 3] = 'B'
    grid[top - 1][CX - 2] = grid[top - 1][CX + 2] = 'B'
  } else if (parts.ears === 2) {
    grid[top - 2][CX - 2] = grid[top - 1][CX - 2] = 'b'
    grid[top - 2][CX + 2] = grid[top - 1][CX + 2] = 'b'
    grid[top - 3][CX - 2] = 'a' // glowing tips
    grid[top - 3][CX + 2] = 'a'
  } else {
    grid[top - 1][CX] = 'a'
    grid[top - 2][CX] = 'a'
  }

  // Eyes — two dark dots with a glint above each
  const eyeY = top + 3
  grid[eyeY][CX - 2] = 'E'
  grid[eyeY][CX + 2] = 'E'
  grid[eyeY - 1][CX - 2] = 'h'
  grid[eyeY - 1][CX + 2] = 'h'

  // Accent
  if (parts.accent === 0) {
    for (let y = top + 5; y < top + h - 1; y++) {
      for (let x = CX - 1; x <= CX + 1; x++) {
        if (grid[y][x] !== ' ') grid[y][x] = 'a' // belly patch
      }
    }
  } else {
    for (let y = top + 1; y < top + h; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[y][x] === 'B' && rng() < 0.12) grid[y][x] = 'a' // speckles
      }
    }
  }

  const pal = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE]
  const palette = { B: pal.main, b: pal.shade, a: pal.hi, E: EYE, h: GLINT }
  return { grid: grid.map((row) => row.join('')), palette }
}
