import { describe, it, expect, beforeEach } from 'vitest'
import { read, write, migrate, DEFAULTS, SCHEMA_VERSION } from './StorageManager.js'

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
})
