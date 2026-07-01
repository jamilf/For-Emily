// SpiritGenerator — procedurally builds Forest Spirit companions as PixelSprite-
// compatible { grid, palette } from a numeric seed + a palette key. Deterministic:
// the same (seed, paletteKey) always renders the same spirit.
//
// This is a NEW generator that reuses the shared pixel primitive (PixelSprite) and
// mirrors PlantGenerator's seeded-RNG + decode approach — it does NOT fork the tree
// art. A seed decodes into body silhouette × ear style × accent, giving distinct
// little creatures; the palette is drawn entirely from existing design tokens.
//
// Renderer 2.0: spirits are generated natively at 2x resolution (26x26) with the
// same deterministic detail passes as the trees: a soft outline around the body,
// a 3-step ramp lit from the upper-left, and finer accents. The seed decode and
// every spirit's identity are untouched.

const W = 26
const CX = 12.5
const H = 26

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

// Body-family chars the outline pass may darken (accents/eyes keep their glow).
const BODY_CHARS = new Set(['B', 'b', 'd'])

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

// Derive a lighter/darker ramp tone from a hex colour (pure integer math).
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
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

// Is (x,y) inside the body silhouette for a given body shape? (2x-scaled bounds.)
function inBody(body, x, y, top, h) {
  const ry = h / 2
  const cy = top + ry
  const dx = x - CX
  const dy = y - cy
  switch (body) {
    case 1: // tall / narrow
      return (dx * dx) / 40 + (dy * dy) / (ry * ry) <= 1
    case 2: // wide / chubby
      return (dx * dx) / 128 + (dy * dy) / (ry * ry * 0.82) <= 1
    default: // round
      return (dx * dx) / 80 + (dy * dy) / (ry * ry) <= 1
  }
}

// Detail pass: soften the silhouette with a 1px darker outline (body tones only,
// so glowing accents and antenna tips keep their light).
function outlinePass(grid) {
  const src = grid.map((row) => row.slice())
  const at = (x, y) => (src[y] && src[y][x]) || ' '
  for (let y = 0; y < src.length; y++) {
    for (let x = 0; x < W; x++) {
      if (!BODY_CHARS.has(src[y][x])) continue
      const edge =
        at(x - 1, y) === ' ' || at(x + 1, y) === ' ' || at(x, y - 1) === ' ' || at(x, y + 1) === ' '
      if (edge) grid[y][x] = 'e'
    }
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
  const top = 6
  const h = 18 // body occupies rows 6..23
  const rx = parts.body === 2 ? 11 : parts.body === 1 ? 6 : 9

  // Body with a 3-step ramp lit from the upper-left.
  for (let y = top; y < top + h; y++) {
    for (let x = 0; x < W; x++) {
      if (!inBody(parts.body, x, y, top, h)) continue
      const lt = ((x - (CX - rx)) / (2 * rx) + (y - top) / h) / 2
      grid[y][x] = lt < 0.26 ? 'd' : lt > 0.66 ? 'b' : 'B'
    }
  }

  // Ears / antennae crowning the head (2x-scaled placements).
  if (parts.ears === 1) {
    // pointed ears: two little triangles
    for (const [outer, inner] of [
      [6, 8],
      [18, 16],
    ]) {
      for (let y = top - 4; y < top; y++) {
        grid[y][outer] = grid[y][outer + 1] = 'B'
      }
      for (let y = top - 2; y < top; y++) {
        grid[y][inner] = grid[y][inner + 1] = 'B'
      }
    }
  } else if (parts.ears === 2) {
    // antennae with glowing tips
    for (let y = top - 4; y < top; y++) {
      grid[y][8] = 'b'
      grid[y][17] = 'b'
    }
    for (let y = top - 6; y < top - 4; y++) {
      grid[y][7] = grid[y][8] = 'a'
      grid[y][16] = grid[y][17] = 'a'
    }
  } else {
    // a soft glowing tuft
    for (let y = top - 4; y < top; y++) {
      grid[y][12] = grid[y][13] = 'a'
    }
  }

  // Eyes — two 2x2 dark dots, each with a single glint pixel catching the light.
  const eyeY = top + 6
  for (const ex of [8, 16]) {
    grid[eyeY][ex] = grid[eyeY][ex + 1] = 'E'
    grid[eyeY + 1][ex] = grid[eyeY + 1][ex + 1] = 'E'
    grid[eyeY][ex] = 'h'
  }

  // Accent
  if (parts.accent === 0) {
    // belly patch
    for (let y = top + 10; y < top + h - 2; y++) {
      for (let x = 10; x <= 15; x++) {
        if (grid[y][x] !== ' ') grid[y][x] = 'a'
      }
    }
  } else {
    // fine speckles across the lit body
    for (let y = top + 2; y < top + h; y++) {
      for (let x = 0; x < W; x++) {
        if (grid[y][x] === 'B' && rng() < 0.1) grid[y][x] = 'a'
      }
    }
  }

  outlinePass(grid)

  const pal = PALETTES[paletteKey] || PALETTES[DEFAULT_PALETTE]
  const palette = {
    B: pal.main,
    b: pal.shade,
    d: shadeHex(pal.main, 1.16), // lit crown
    e: shadeHex(pal.shade, 0.6), // soft outline
    a: pal.hi,
    E: EYE,
    h: GLINT,
  }
  return { grid: grid.map((row) => row.join('')), palette }
}
