// Sanctuary Seasons — a DERIVED world-shift driven by growth, not the calendar.
// As Emily harvests trees (emily.garden.length) the sanctuary eases from Spring to
// Winter. Nothing new is persisted or synced; this only reads the garden count.
//
// Effects are intentionally subtle (a bottom-weighted tint + light ambient motes) and
// the season is always conveyed by NAME, never colour alone. Every tint is low-opacity
// so it can sit behind the opaque content cards without touching text contrast.

// The single tunable constant — the harvest counts at which each season arrives.
// Gentle pace so the world feels alive within the first weeks (one tree = one session).
export const SEASON_THRESHOLDS = { summer: 8, autumn: 20, winter: 40 }

// Ordered Spring → Winter. Tints use existing palette tokens at low opacity. `accent`
// colours the ambient particles; `particle` is just a semantic label.
export const SEASONS = [
  {
    id: 'spring',
    name: 'Spring',
    emoji: '🌸',
    blurb: 'Soft beginnings. The sanctuary wakes up green and hopeful.',
    threshold: 0,
    tint: 'rgba(167, 192, 128, 0.10)', // ever-green
    accent: '#F4A6C0', // sunset-pink petals
    particle: 'petal',
  },
  {
    id: 'summer',
    name: 'Summer',
    emoji: '☀️',
    blurb: 'Long, warm light. Your grove is thriving.',
    threshold: SEASON_THRESHOLDS.summer,
    tint: 'rgba(255, 210, 125, 0.10)', // sunset-gold
    accent: '#FFD27D', // golden motes
    particle: 'mote',
  },
  {
    id: 'autumn',
    name: 'Autumn',
    emoji: '🍂',
    blurb: 'Amber and rust, a season of quiet, earned warmth.',
    threshold: SEASON_THRESHOLDS.autumn,
    tint: 'rgba(230, 152, 117, 0.12)', // ever-orange
    accent: '#E69875', // drifting leaves
    particle: 'leaf',
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    blurb: 'Still and cool, the deepest, coziest season of all.',
    threshold: SEASON_THRESHOLDS.winter,
    tint: 'rgba(127, 187, 179, 0.10)', // ever-blue
    accent: '#D3EAF0', // pale snow
    particle: 'snow',
  },
]

export const SEASONS_BY_ID = Object.fromEntries(SEASONS.map((s) => [s.id, s]))

/**
 * The current season for a total harvested count. Boundary-correct: reaching a
 * threshold advances the season (`total >= threshold`).
 * @param {number} total  garden.length
 */
export function seasonForHarvest(total = 0) {
  const n = Number.isFinite(total) ? total : 0
  // Walk from the deepest season down; the first whose threshold is met wins.
  for (let i = SEASONS.length - 1; i >= 0; i--) {
    if (n >= SEASONS[i].threshold) return SEASONS[i]
  }
  return SEASONS[0]
}

/**
 * Progress toward the next season, for the encouraging "N more trees" copy.
 * @returns {{ season, next, current, target, remaining }} next is null in Winter.
 */
export function seasonProgress(total = 0) {
  const n = Number.isFinite(total) && total > 0 ? total : 0
  const season = seasonForHarvest(n)
  const idx = SEASONS.findIndex((s) => s.id === season.id)
  const next = idx < SEASONS.length - 1 ? SEASONS[idx + 1] : null
  return {
    season,
    next,
    current: n,
    target: next ? next.threshold : null,
    remaining: next ? Math.max(0, next.threshold - n) : 0,
  }
}
