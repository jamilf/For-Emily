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
