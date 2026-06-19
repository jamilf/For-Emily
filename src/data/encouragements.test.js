import { describe, it, expect } from 'vitest'
import {
  ENCOURAGEMENTS,
  resolveText,
  pickByContext,
  verseOfDay,
  randomSignoff,
  SIGNOFFS,
} from './encouragements.js'

describe('encouragement library shape', () => {
  it('has items, each with id / type / contexts', () => {
    expect(ENCOURAGEMENTS.length).toBeGreaterThan(100)
    for (const it of ENCOURAGEMENTS.slice(0, 50)) {
      expect(it).toHaveProperty('id')
      expect(['original', 'scripture']).toContain(it.type)
      expect(Array.isArray(it.contexts)).toBe(true)
    }
  })
})

describe('pickByContext — no-repeat shuffle bag', () => {
  it('returns an item with resolved text and an updated seen list', () => {
    const { item, nextSeen, text } = pickByContext('complete', { seen: [], verses: {} })
    expect(item).toBeTruthy()
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
    expect(nextSeen).toContain(item.id)
  })

  it('does not repeat an id until the eligible pool is exhausted', () => {
    let seen = []
    const picks = new Set()
    // Pull many times; until exhaustion every pick should be a fresh id.
    for (let i = 0; i < 12; i++) {
      const r = pickByContext('idle', { seen, verses: {} })
      if (seen.length < 12) expect(picks.has(r.item.id)).toBe(false)
      picks.add(r.item.id)
      seen = r.nextSeen
    }
    expect(picks.size).toBeGreaterThan(1)
  })

  it('skips scripture items whose verse text is not cached, and never throws on an unknown context', () => {
    const r = pickByContext('totally-unknown-context', { seen: [], verses: {} })
    expect(r.item).toBeTruthy()
    expect(r.item.type).toBe('original') // falls back to originals
  })

  it('includes a scripture item once its verse is cached', () => {
    // Pick a real scripture item and study it in one of ITS declared contexts,
    // so eligibility is guaranteed once the verse text is cached.
    const scripture = ENCOURAGEMENTS.find((i) => i.type === 'scripture' && i.contexts.length > 0)
    const ctx = scripture.contexts[0]
    const verses = { [scripture.ref]: 'A cached verse text for testing.' }
    let found = false
    let seen = []
    for (let i = 0; i < 200 && !found; i++) {
      const r = pickByContext(ctx, { seen, verses })
      if (r.item.ref === scripture.ref) found = true
      seen = r.nextSeen
    }
    expect(found).toBe(true)
  })
})

describe('resolveText', () => {
  it('returns original text directly and scripture text from the cache', () => {
    const original = ENCOURAGEMENTS.find((i) => i.type === 'original')
    expect(resolveText(original, {})).toBe(original.text)
    const scripture = ENCOURAGEMENTS.find((i) => i.type === 'scripture')
    const verses = { [scripture.ref]: 'cached words' }
    expect(resolveText(scripture, verses)).toContain('cached words')
  })
})

describe('verseOfDay', () => {
  it('is deterministic for a given date', () => {
    const a = verseOfDay({}, '2026-06-19')
    const b = verseOfDay({}, '2026-06-19')
    expect(a.ref).toBe(b.ref)
  })
  it('can vary across dates', () => {
    const refs = new Set(
      ['2026-01-01', '2026-03-15', '2026-06-19', '2026-09-09', '2026-12-25'].map(
        (d) => verseOfDay({}, d).ref,
      ),
    )
    expect(refs.size).toBeGreaterThan(1)
  })
})

describe('randomSignoff', () => {
  it('returns one of the known sign-offs', () => {
    expect(SIGNOFFS).toContain(randomSignoff())
  })
})
