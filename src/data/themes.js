// Scene Themes — cosmetic skies Emily unlocks as her grove grows. A DERIVED,
// sticky-unlock feature built on the same engine as the Grove Almanac and Forest
// Spirits: each theme has a `rule` evaluated by grove.js's `progressFor`, and
// `reconcileThemes` adds newly-earned themes (stamped with the day) without ever
// removing one. Choosing a theme only tints the scene; nothing about progress
// changes. The default 'grove' theme is always unlocked and fully transparent, so
// the sanctuary looks exactly as it always has until Emily picks another.
//
// Every tint is a low-opacity rgba (alpha <= 0.16) so it can sit behind the opaque
// content cards without touching text contrast, and each theme is always conveyed
// by NAME, never colour alone.

import { progressFor, groveMetrics } from './grove.js'
import { dayStr } from '../utils/day.js'

export const DEFAULT_THEME_ID = 'grove'

// Ordered by unlock threshold (trees grown). The first is the always-on default.
export const THEMES = [
  {
    id: 'grove',
    name: 'Grove',
    emoji: '🌿',
    blurb: 'The sanctuary just as you found it, green and quiet.',
    rule: { metric: 'grown', n: 0 },
    tint: 'rgba(0, 0, 0, 0)', // transparent: the scene is unchanged
    accent: '#A7C080',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    blurb: 'A soft blush of cherry blossom over the whole sky.',
    rule: { metric: 'grown', n: 5 },
    tint: 'rgba(244, 166, 192, 0.12)',
    accent: '#F7C5D6',
  },
  {
    id: 'embers',
    name: 'Embers',
    emoji: '🔥',
    blurb: 'Warm amber light, like a low fire at the end of the day.',
    rule: { metric: 'grown', n: 12 },
    tint: 'rgba(224, 122, 72, 0.13)',
    accent: '#F4A65F',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    blurb: 'A quiet ribbon of green and violet, drawn across the dark.',
    rule: { metric: 'grown', n: 22 },
    tint: 'rgba(96, 196, 160, 0.12)',
    accent: '#8A7FE0',
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    emoji: '🌙',
    blurb: 'Cool silver and deep indigo, calm and far away.',
    rule: { metric: 'grown', n: 35 },
    tint: 'rgba(96, 112, 170, 0.14)',
    accent: '#AEB8E0',
  },
  {
    id: 'goldenhour',
    name: 'Golden Hour',
    emoji: '🌅',
    blurb: 'The whole grove dipped in warm, forgiving gold.',
    rule: { metric: 'grown', n: 50 },
    tint: 'rgba(255, 196, 120, 0.13)',
    accent: '#FFD27D',
  },
]

export const THEMES_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]))

/** Is a theme unlocked in the stored map (or always-on by being the default)? */
export function isThemeUnlocked(theme, store) {
  return theme.id === DEFAULT_THEME_ID || !!store?.unlocked?.[theme.id]
}

/**
 * Reconcile sticky theme unlocks against live metrics. Mirrors grove.reconcile but
 * preserves `selected` (instead of the grove's `plantNext`). Pure; pass `today` for
 * deterministic tests.
 * @returns {{ themes: { selected: string|null, unlocked: Object }, newlyUnlocked: object[] }}
 */
export function reconcileThemes(store, metrics, today = dayStr()) {
  const unlocked = { ...(store?.unlocked || {}) }
  const newlyUnlocked = []
  for (const theme of THEMES) {
    if (theme.id === DEFAULT_THEME_ID) continue // always-on, never "newly" unlocked
    if (unlocked[theme.id]) continue
    if (progressFor(theme, metrics).done) {
      unlocked[theme.id] = today
      newlyUnlocked.push(theme)
    }
  }
  return { themes: { selected: store?.selected ?? null, unlocked }, newlyUnlocked }
}

/**
 * The theme to actually render: the selected one when it is set AND unlocked, else
 * the default. So a stale or locked selection can never blank the scene.
 */
export function resolveTheme(store, metrics) {
  const id = store?.selected
  if (id && id !== DEFAULT_THEME_ID) {
    const theme = THEMES_BY_ID[id]
    if (theme && isThemeUnlocked(theme, store) && progressFor(theme, metrics).done) return theme
  }
  return THEMES_BY_ID[DEFAULT_THEME_ID]
}

/** Convenience: derive metrics + resolve in one call from the raw stores. */
export function activeTheme(store, { garden = [], stats = {}, flashcardStats = {}, reflections = [] } = {}) {
  return resolveTheme(store, groveMetrics({ garden, stats, flashcardStats, reflections }))
}
