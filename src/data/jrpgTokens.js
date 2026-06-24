// JRPG UI palette tokens + WCAG contrast math. PURE and deterministic, so the
// accessibility of every window/nameplate/cursor pairing is unit-tested rather than
// hoped for (classic JRPG palettes drift low-contrast; this keeps us honest at AA).
//
// The palette layers a cozy 16-bit "dialogue window" (a deep warm indigo with cream
// text, gold cursor, wood nameplate) over the app's existing Everforest + sunset
// warmth, so it reads as the same world in a game-UI frame, never a cold reskin.
// These values are mirrored into CSS custom properties in index.css; this module is
// the single source of truth and the thing the tests assert on.

export const TOKENS = {
  // The dark dialogue/menu window (the JRPG identity surface).
  windowBg: '#2A2342', // deep warm indigo
  windowBgHi: '#3A3158', // interior gradient top (lighter)
  windowText: '#FDF6E3', // cream
  windowTextDim: '#D3C6AA', // Everforest fg, for secondary lines
  edgeLight: '#6E5A8C', // raised bevel highlight
  edgeDark: '#15112A', // recessed bevel shadow
  // Wood nameplate (ties the game UI to the Ghibli interior).
  nameplateBg: '#6E4527', // brownDark
  nameplateText: '#FDF6E3', // cream
  // Selection cursor + selected menu row.
  cursor: '#FFD27D', // sunset gold
  menuSelBg: '#4A3E6E', // lighter indigo for the focused row
  menuSelText: '#FDF6E3',
  // Light "paper" body (unchanged content surface, kept for long-form reading).
  paperBg: '#FDF6E3', // cream
  paperText: '#3A2A1A', // a hair darker than brownDark for body copy
  // The companion portrait sits in its own light frame so the near-black soot
  // sprite stays legible against the dark dialogue window.
  portraitBg: '#FDF6E3', // cream
}

// The darkest pixel in the soot companion sprite (sprites.js PAL 'b'); the portrait
// frame must keep it legible.
export const SOOT_DARKEST = '#20272b'

/** sRGB hex (#rgb or #rrggbb) → {r,g,b} in 0..255. */
function toRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '')
  if (h.length === 3) h = h.replace(/(.)/g, '$1$1')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** WCAG relative luminance of an sRGB color. Pure. */
export function relativeLuminance(hex) {
  const { r, g, b } = toRgb(hex)
  const lin = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two colors (1..21). Pure, order-independent. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

/** Does fg-on-bg meet WCAG AA? 4.5:1 for normal text, 3:1 for large text/UI. */
export function meetsAA(fg, bg, large = false) {
  return contrastRatio(fg, bg) >= (large ? 3 : 4.5)
}

/**
 * The foreground/background pairings the UI actually renders, each tagged whether
 * it carries normal-size text (AA 4.5) or only large text / UI shapes (AA 3). The
 * contrast test iterates this list, so adding a token pairing forces a contrast
 * check for it too.
 */
export const CONTRAST_PAIRS = [
  { name: 'window text on window', fg: TOKENS.windowText, bg: TOKENS.windowBg },
  { name: 'window text on window highlight', fg: TOKENS.windowText, bg: TOKENS.windowBgHi },
  { name: 'dim window text on window', fg: TOKENS.windowTextDim, bg: TOKENS.windowBg },
  { name: 'nameplate text on nameplate', fg: TOKENS.nameplateText, bg: TOKENS.nameplateBg },
  { name: 'selected row text on selected row', fg: TOKENS.menuSelText, bg: TOKENS.menuSelBg },
  { name: 'paper body text on paper', fg: TOKENS.paperText, bg: TOKENS.paperBg },
  // The cursor is a UI shape (large-AA), shown against both window states.
  { name: 'cursor on window', fg: TOKENS.cursor, bg: TOKENS.windowBg, large: true },
  { name: 'cursor on selected row', fg: TOKENS.cursor, bg: TOKENS.menuSelBg, large: true },
]
