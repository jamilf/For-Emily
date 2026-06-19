import { describe, it, expect, afterEach, vi } from 'vitest'
import { fetchVerses, TRANSLATION, ATTRIBUTION } from './scripture.js'

afterEach(() => vi.unstubAllGlobals())

describe('scripture config', () => {
  it('defaults to the public-domain WEB translation with attribution', () => {
    expect(TRANSLATION).toBe('web')
    expect(ATTRIBUTION).toMatch(/World English Bible/i)
  })
})

describe('fetchVerses (WEB provider, mocked network)', () => {
  it('caches fetched verse text and returns a new map', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ text: 'For God so loved the world  ' }) })),
    )
    const out = await fetchVerses(['John 3:16'], {})
    expect(out['John 3:16']).toBe('For God so loved the world')
  })

  it('does not re-fetch refs already cached', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const out = await fetchVerses(['John 3:16'], { 'John 3:16': 'cached' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(out['John 3:16']).toBe('cached')
  })

  it('skips a ref on a non-ok response without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    )
    const out = await fetchVerses(['Psalm 23:1'], {})
    expect(out['Psalm 23:1']).toBeUndefined()
  })

  it('swallows network errors (offline) and leaves the cache intact', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    const out = await fetchVerses(['Psalm 46:1'], { existing: 'keep' })
    expect(out).toEqual({ existing: 'keep' })
  })

  it('respects the request limit', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ text: 'x' }) }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchVerses(['a', 'b', 'c', 'd'], {}, 2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
