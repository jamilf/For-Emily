import { describe, it, expect } from 'vitest'
import { SYNC_KEYS, isSyncKey } from './syncEngine.js'

describe('SYNC_KEYS', () => {
  it('syncs the Firefly Calendar time-series across devices', () => {
    expect(SYNC_KEYS).toContain('emily.focusLog')
    expect(isSyncKey('emily.focusLog')).toBe(true)
  })

  it('syncs Forest Spirits across devices', () => {
    expect(SYNC_KEYS).toContain('emily.spirits')
    expect(isSyncKey('emily.spirits')).toBe(true)
  })

  it('syncs Memory Grove across devices', () => {
    expect(SYNC_KEYS).toContain('emily.memories')
    expect(isSyncKey('emily.memories')).toBe(true)
  })

  it('leaves device-local caches out of sync', () => {
    expect(isSyncKey('emily.mixer')).toBe(false)
    expect(isSyncKey('emily.zen')).toBe(false)
  })
})
