import { describe, it, expect, beforeEach } from 'vitest'
import {
  read,
  write,
  migrate,
  exportAll,
  importAll,
  validateBackup,
  DEFAULTS,
  SCHEMA_VERSION,
} from './StorageManager.js'

beforeEach(() => localStorage.clear())

describe('read', () => {
  it('returns the default when the key is absent', () => {
    expect(read('emily.brainDump')).toBe(DEFAULTS['emily.brainDump'])
    expect(read('emily.garden')).toEqual([])
  })

  it('returns a parsed value when present', () => {
    localStorage.setItem('emily.brainDump', JSON.stringify('hello'))
    expect(read('emily.brainDump')).toBe('hello')
  })

  it('shallow-merges object defaults so new sub-fields appear on old saves', () => {
    // An old mixer save missing newer level keys still resolves them from defaults.
    localStorage.setItem(
      'emily.mixer',
      JSON.stringify({ enabled: true, master: 0.3, levels: { steadyRain: 0.9 } }),
    )
    const m = read('emily.mixer')
    expect(m.enabled).toBe(true)
    expect(m.master).toBe(0.3)
    expect(m.levels.steadyRain).toBe(0.9)
    expect(m.levels.fireplace).toBe(0) // filled from defaults
  })

  it('falls back to the default on corrupt JSON instead of throwing', () => {
    localStorage.setItem('emily.garden', '{not json')
    expect(read('emily.garden')).toEqual([])
  })

  it('honors an explicit fallback over the registry default', () => {
    expect(read('emily.unknownKey', 42)).toBe(42)
  })
})

describe('write', () => {
  it('persists JSON and never throws', () => {
    expect(() => write('emily.brainDump', 'note')).not.toThrow()
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('note')
  })
})

describe('migrate', () => {
  it('stamps the current schema version on a fresh install', () => {
    migrate()
    expect(localStorage.getItem('emily.schemaVersion')).toBe(String(SCHEMA_VERSION))
  })

  it('is idempotent and never destroys existing data', () => {
    localStorage.setItem('emily.flashcards', JSON.stringify([{ id: 1, front: 'a', back: 'b' }]))
    migrate()
    migrate()
    expect(localStorage.getItem('emily.schemaVersion')).toBe(String(SCHEMA_VERSION))
    expect(JSON.parse(localStorage.getItem('emily.flashcards'))).toHaveLength(1)
  })

  it('upgrades an old version stamp without clearing keys', () => {
    localStorage.setItem('emily.schemaVersion', '1')
    localStorage.setItem('emily.brainDump', JSON.stringify('keep me'))
    migrate()
    expect(localStorage.getItem('emily.schemaVersion')).toBe(String(SCHEMA_VERSION))
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
  })

  it('v7→v8: defaults entrainment and prunes the retired ambient layers (idempotent)', () => {
    localStorage.setItem('emily.schemaVersion', '7')
    localStorage.setItem(
      'emily.mixer',
      JSON.stringify({
        enabled: true,
        master: 0.4,
        musicStyle: 'lofi',
        musicVolume: 0.6,
        levels: { steadyRain: 0.8, coffeeShop: 0.5, brownNoise: 0.3, fireplace: 0.2 },
      }),
    )
    migrate()
    const m = JSON.parse(localStorage.getItem('emily.mixer'))
    expect(m.entrainment).toBe(false)
    expect(m.levels.coffeeShop).toBeUndefined()
    expect(m.levels.brownNoise).toBeUndefined()
    expect(m.levels.steadyRain).toBe(0.8) // kept value
    expect(m.levels.fireplace).toBe(0.2) // kept value
    expect(m.musicStyle).toBe('lofi') // preserved
    migrate() // idempotent
    expect(JSON.parse(localStorage.getItem('emily.mixer')).entrainment).toBe(false)
  })

  it('v8→v9: additive flashcard type/prefs are non-destructive and double-run safe', () => {
    localStorage.setItem('emily.schemaVersion', '8')
    // A legacy card with no `type` field, and existing stats.
    localStorage.setItem(
      'emily.flashcards',
      JSON.stringify([{ id: 1, deck: 'D', front: 'q', back: 'a', box: 3, due: 123, reps: 4 }]),
    )
    migrate()
    expect(localStorage.getItem('emily.schemaVersion')).toBe(String(SCHEMA_VERSION))
    // The saved card is untouched on disk (it self-heals via normalizeCard at read).
    const cards = JSON.parse(localStorage.getItem('emily.flashcards'))
    expect(cards).toHaveLength(1)
    expect(cards[0].box).toBe(3)
    expect(cards[0].reps).toBe(4)
    // The new prefs key resolves to its default via read()'s fallback.
    expect(read('emily.flashPrefs').typed).toBe(false)
    expect(read('emily.flashPrefs').lastSize).toBe(10)
    // Double-run is a no-op.
    const before = localStorage.getItem('emily.flashcards')
    migrate()
    expect(localStorage.getItem('emily.flashcards')).toBe(before)
  })

  it('v9→v10: the JRPG emily.ui prefs key is defaults-backed and non-destructive', () => {
    localStorage.setItem('emily.schemaVersion', '9')
    localStorage.setItem('emily.brainDump', JSON.stringify('keep me'))
    migrate()
    expect(localStorage.getItem('emily.schemaVersion')).toBe(String(SCHEMA_VERSION))
    // The new prefs resolve to their defaults via read()'s fallback (no write needed).
    expect(read('emily.ui').effects).toBe('full')
    expect(read('emily.ui').typewriter).toBe(true)
    expect(read('emily.ui').sounds).toBe(0)
    // Unrelated existing data is untouched, and a double-run changes nothing.
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
  })

  it('v10→v11: existing users (with history) skip the first-run intro', () => {
    localStorage.setItem('emily.schemaVersion', '10')
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 1, ts: Date.now() }]))
    migrate()
    expect(read('emily.ui').onboarded).toBe(true) // history → never re-onboarded
    // Idempotent: a second run keeps it true.
    migrate()
    expect(read('emily.ui').onboarded).toBe(true)
  })

  it('v10→v11: a brand-new install keeps onboarded=false so the intro shows once', () => {
    localStorage.setItem('emily.schemaVersion', '10')
    migrate()
    expect(read('emily.ui').onboarded).toBe(false)
  })

  it('seeds the Grove retroactively from existing stats on the v2→v3 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '2')
    // Two grown trees already → first-sprout (≥1) and quiet-pine (≥2) earned.
    localStorage.setItem(
      'emily.garden',
      JSON.stringify([
        { id: 0, ts: 1 },
        { id: 1, ts: 2 },
      ]),
    )
    migrate()
    const grove = JSON.parse(localStorage.getItem('emily.grove'))
    expect(grove.unlocked['first-sprout']).toBeTruthy()
    expect(grove.unlocked['quiet-pine']).toBeTruthy()
  })

  it('backfills the Firefly Calendar from the garden on the v3→v4 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '3')
    // Two sessions on one local day, one on the next.
    localStorage.setItem(
      'emily.garden',
      JSON.stringify([
        { id: 0, ts: new Date(2026, 5, 18, 9, 0).getTime() },
        { id: 1, ts: new Date(2026, 5, 18, 15, 0).getTime() },
        { id: 2, ts: new Date(2026, 5, 19, 10, 0).getTime() },
      ]),
    )
    migrate()
    const log = JSON.parse(localStorage.getItem('emily.focusLog'))
    expect(log['2026-06-18']).toEqual({ sessions: 2, minutes: null })
    expect(log['2026-06-19']).toEqual({ sessions: 1, minutes: null })
  })

  it('re-running the v3→v4 backfill is a no-op and never overwrites a live day', () => {
    localStorage.setItem('emily.schemaVersion', '3')
    localStorage.setItem(
      'emily.garden',
      JSON.stringify([{ id: 0, ts: new Date(2026, 5, 18, 9, 0).getTime() }]),
    )
    // A live day already carries real minutes — backfill must not clobber it.
    localStorage.setItem('emily.focusLog', JSON.stringify({ '2026-06-18': { sessions: 1, minutes: 25 } }))
    migrate()
    migrate()
    const log = JSON.parse(localStorage.getItem('emily.focusLog'))
    expect(log['2026-06-18']).toEqual({ sessions: 1, minutes: 25 }) // preserved
  })

  it('does not mutate unrelated keys during the v3→v4 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '3')
    localStorage.setItem('emily.brainDump', JSON.stringify('keep me'))
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: 1 }]))
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
    expect(JSON.parse(localStorage.getItem('emily.garden'))).toEqual([{ id: 0, ts: 1 }])
  })

  it('seeds Forest Spirits retroactively (undated) on the v4→v5 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '4')
    // A 7-day streak earns Persistence; one session earns Curiosity.
    localStorage.setItem('emily.stats', JSON.stringify({ streak: 7 }))
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: new Date(2026, 5, 18, 13).getTime() }]))
    migrate()
    const spirits = JSON.parse(localStorage.getItem('emily.spirits'))
    expect(spirits.unlocked.persistence).toBe(true)
    expect(spirits.unlocked.curiosity).toBe(true)
    // Retroactive unlocks carry no fabricated discovery date.
    expect(spirits.discoveredAt.persistence).toBeNull()
  })

  it('re-running the v4→v5 spirits seed is a no-op (idempotent)', () => {
    localStorage.setItem('emily.schemaVersion', '4')
    localStorage.setItem('emily.stats', JSON.stringify({ streak: 7 }))
    migrate()
    const first = localStorage.getItem('emily.spirits')
    localStorage.setItem('emily.schemaVersion', '4') // force the guard to run again
    migrate()
    expect(localStorage.getItem('emily.spirits')).toBe(first)
  })

  it('does not mutate unrelated keys during the v4→v5 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '4')
    localStorage.setItem('emily.brainDump', JSON.stringify('keep me'))
    localStorage.setItem(
      'emily.grove',
      JSON.stringify({ unlocked: { 'first-sprout': '2026-01-01' }, plantNext: null }),
    )
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
    expect(JSON.parse(localStorage.getItem('emily.grove'))).toEqual({
      unlocked: { 'first-sprout': '2026-01-01' },
      plantNext: null,
    })
  })

  it('ensures emily.memories exists on the v5→v6 upgrade (empty)', () => {
    localStorage.setItem('emily.schemaVersion', '5')
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.memories'))).toEqual([])
  })

  it('never overwrites existing memories on the v5→v6 upgrade, and double-runs as a no-op', () => {
    const mem = [{ id: 1, dna: 5, ts: 9, title: 'Passed exam', note: '' }]
    localStorage.setItem('emily.schemaVersion', '5')
    localStorage.setItem('emily.memories', JSON.stringify(mem))
    migrate()
    localStorage.setItem('emily.schemaVersion', '5') // force the guard to run again
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.memories'))).toEqual(mem)
  })

  it('does not mutate unrelated keys during the v5→v6 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '5')
    localStorage.setItem('emily.brainDump', JSON.stringify('keep me'))
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('keep me')
  })

  it('seeds the emily.story default on the v6→v7 upgrade', () => {
    localStorage.setItem('emily.schemaVersion', '6')
    migrate()
    const story = JSON.parse(localStorage.getItem('emily.story'))
    expect(story).toMatchObject({ lastSeen: 0, seenBeats: {}, ackChapters: {}, comebackShown: {} })
  })

  it('a brand-new install keeps story.lastSeen = 0 (so the first open reads as first-day)', () => {
    migrate() // fresh install, version 0, no garden
    expect(JSON.parse(localStorage.getItem('emily.story')).lastSeen).toBe(0)
  })

  it('an existing user with history seeds lastSeen to NOW (no false comeback on upgrade)', () => {
    localStorage.setItem('emily.schemaVersion', '6')
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: 1 }]))
    const before = Date.now()
    migrate()
    const last = JSON.parse(localStorage.getItem('emily.story')).lastSeen
    expect(last).toBeGreaterThanOrEqual(before)
  })

  it('never overwrites an existing emily.story, and double-runs as a no-op', () => {
    const story = { lastSeen: 123, seenBeats: { x: true }, ackChapters: { stirs: true }, comebackShown: {} }
    localStorage.setItem('emily.schemaVersion', '6')
    localStorage.setItem('emily.story', JSON.stringify(story))
    migrate()
    localStorage.setItem('emily.schemaVersion', '6') // force the guard to run again
    migrate()
    expect(JSON.parse(localStorage.getItem('emily.story'))).toEqual(story)
  })
})

describe('backup export/import (Sanctuary backup)', () => {
  it('exports every emily.* key except auth + sync meta', () => {
    localStorage.setItem('emily.brainDump', JSON.stringify('notes'))
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 1, ts: 5 }]))
    localStorage.setItem('emily.auth', JSON.stringify({ token: 'secret' }))
    localStorage.setItem('emily.sync.meta', JSON.stringify({ 'emily.garden': 5 }))
    const backup = exportAll()
    expect(backup.app).toBe('emilys-study-sanctuary')
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(backup.data['emily.brainDump']).toBe('notes')
    expect(backup.data['emily.garden']).toEqual([{ id: 1, ts: 5 }])
    expect(backup.data).not.toHaveProperty('emily.auth')
    expect(backup.data).not.toHaveProperty('emily.sync.meta')
  })

  it('round-trips: export → clear → import restores the data', () => {
    localStorage.setItem('emily.flashcards', JSON.stringify([{ id: 1, front: 'q', back: 'a' }]))
    localStorage.setItem('emily.brainDump', JSON.stringify('remember this'))
    const backup = exportAll()

    localStorage.clear()
    expect(localStorage.getItem('emily.brainDump')).toBeNull()

    const restored = importAll(backup)
    expect(restored).toBe(2)
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('remember this')
    expect(JSON.parse(localStorage.getItem('emily.flashcards'))).toHaveLength(1)
  })

  it('includes emily.focusLog in a backup and round-trips it', () => {
    localStorage.setItem('emily.focusLog', JSON.stringify({ '2026-06-18': { sessions: 3, minutes: 75 } }))
    const backup = exportAll()
    expect(backup.data['emily.focusLog']).toEqual({ '2026-06-18': { sessions: 3, minutes: 75 } })

    localStorage.clear()
    importAll(backup)
    expect(JSON.parse(localStorage.getItem('emily.focusLog'))).toEqual({
      '2026-06-18': { sessions: 3, minutes: 75 },
    })
  })

  it('includes emily.spirits in a backup and round-trips it', () => {
    const spirits = {
      unlocked: { curiosity: true },
      seen: { curiosity: true },
      discoveredAt: { curiosity: null },
    }
    localStorage.setItem('emily.spirits', JSON.stringify(spirits))
    const backup = exportAll()
    expect(backup.data['emily.spirits']).toEqual(spirits)

    localStorage.clear()
    importAll(backup)
    expect(JSON.parse(localStorage.getItem('emily.spirits'))).toEqual(spirits)
  })

  it('includes emily.memories in a backup and round-trips it', () => {
    const memories = [{ id: 1, dna: 42, ts: 9, title: 'Passed exam', note: 'biology final' }]
    localStorage.setItem('emily.memories', JSON.stringify(memories))
    const backup = exportAll()
    expect(backup.data['emily.memories']).toEqual(memories)

    localStorage.clear()
    importAll(backup)
    expect(JSON.parse(localStorage.getItem('emily.memories'))).toEqual(memories)
  })

  it('rejects malformed backups before writing anything', () => {
    expect(() => validateBackup(null)).toThrow()
    expect(() => validateBackup({})).toThrow()
    expect(() => validateBackup({ data: {} })).toThrow()
    expect(() => importAll('not an object')).toThrow()
  })

  it('ignores non-emily and excluded keys on import', () => {
    const restored = importAll({
      data: { 'emily.brainDump': 'ok', evil: 'x', 'emily.auth': { token: 't' } },
    })
    expect(restored).toBe(1)
    expect(JSON.parse(localStorage.getItem('emily.brainDump'))).toBe('ok')
    expect(localStorage.getItem('evil')).toBeNull()
    expect(localStorage.getItem('emily.auth')).toBeNull()
  })
})
