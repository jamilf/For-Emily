import { describe, it, expect } from 'vitest'
import { groveMetrics } from './grove.js'
import {
  THEMES,
  THEMES_BY_ID,
  DEFAULT_THEME_ID,
  isThemeUnlocked,
  reconcileThemes,
  resolveTheme,
  activeTheme,
} from './themes.js'

const metricsFor = (grown) =>
  groveMetrics({ garden: Array.from({ length: grown }, () => ({ id: 0, ts: Date.now() })) })
const alphaOf = (tint) => Number(tint.match(/([\d.]+)\)\s*$/)[1])
const DAY = '2026-06-23'

describe('THEMES catalogue integrity', () => {
  it('has unique ids and strictly increasing thresholds', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    const ns = THEMES.map((t) => t.rule.n)
    for (let i = 1; i < ns.length; i++) expect(ns[i]).toBeGreaterThan(ns[i - 1])
    expect(Object.keys(THEMES_BY_ID)).toHaveLength(THEMES.length)
  })

  it('opens with an always-on, fully transparent default', () => {
    expect(THEMES[0].id).toBe(DEFAULT_THEME_ID)
    expect(THEMES[0].rule.n).toBe(0)
    expect(alphaOf(THEMES[0].tint)).toBe(0) // the scene is unchanged by default
  })

  it('keeps every tint subtle enough to sit behind text (alpha <= 0.16)', () => {
    for (const t of THEMES) expect(alphaOf(t.tint)).toBeLessThanOrEqual(0.16)
  })

  it('conveys every theme by a distinct NAME, never colour alone', () => {
    const names = THEMES.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('reconcileThemes — sticky unlocks', () => {
  it('unlocks a theme exactly at its threshold, stamped with the day', () => {
    const before = reconcileThemes({ selected: null, unlocked: {} }, metricsFor(4), DAY)
    expect(before.newlyUnlocked.map((t) => t.id)).not.toContain('sakura')

    const at = reconcileThemes({ selected: null, unlocked: {} }, metricsFor(5), DAY)
    expect(at.newlyUnlocked.map((t) => t.id)).toContain('sakura')
    expect(at.themes.unlocked.sakura).toBe(DAY)
  })

  it('never re-lists the always-on default as newly unlocked', () => {
    const r = reconcileThemes({ selected: null, unlocked: {} }, metricsFor(60), DAY)
    expect(r.newlyUnlocked.map((t) => t.id)).not.toContain(DEFAULT_THEME_ID)
  })

  it('is sticky: an unlock survives a metric drop and preserves the selection', () => {
    const earned = reconcileThemes({ selected: 'sakura', unlocked: {} }, metricsFor(50), DAY)
    expect(Object.keys(earned.themes.unlocked).length).toBeGreaterThan(0)
    const after = reconcileThemes(earned.themes, metricsFor(0), DAY)
    expect(after.themes.unlocked).toEqual(earned.themes.unlocked) // nothing removed
    expect(after.newlyUnlocked).toHaveLength(0)
    expect(after.themes.selected).toBe('sakura') // selection preserved
  })
})

describe('isThemeUnlocked', () => {
  it('treats the default as always unlocked, others by the stored map', () => {
    const store = { selected: null, unlocked: { sakura: DAY } }
    expect(isThemeUnlocked(THEMES_BY_ID.grove, store)).toBe(true)
    expect(isThemeUnlocked(THEMES_BY_ID.sakura, store)).toBe(true)
    expect(isThemeUnlocked(THEMES_BY_ID.embers, store)).toBe(false)
  })
})

describe('resolveTheme — safe active theme', () => {
  it('returns the selection when set, unlocked, and earned', () => {
    const store = { selected: 'sakura', unlocked: { sakura: DAY } }
    expect(resolveTheme(store, metricsFor(10)).id).toBe('sakura')
  })

  it('falls back to the default for a null, locked, or unearned selection', () => {
    expect(resolveTheme({ selected: null, unlocked: {} }, metricsFor(10)).id).toBe(DEFAULT_THEME_ID)
    // selected but not actually earned (e.g. tampered store) -> default, never blank
    expect(resolveTheme({ selected: 'goldenhour', unlocked: {} }, metricsFor(10)).id).toBe(DEFAULT_THEME_ID)
  })

  it('activeTheme resolves straight from the raw stores', () => {
    const store = { selected: 'sakura', unlocked: { sakura: DAY } }
    const garden = Array.from({ length: 6 }, () => ({ id: 0, ts: Date.now() }))
    expect(activeTheme(store, { garden }).id).toBe('sakura')
    expect(activeTheme({ selected: null, unlocked: {} }, { garden }).id).toBe(DEFAULT_THEME_ID)
  })
})
