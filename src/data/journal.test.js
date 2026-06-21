import { describe, it, expect } from 'vitest'
import { buildJournal, searchJournal, MILESTONES } from './journal.js'
import { SPIRITS_BY_ID } from './spirits.js'
import { SPECIES, dnaOf } from './grove.js'

const ts = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('buildJournal — entry derivation', () => {
  it('turns a memory into a dated entry carrying its tree dna', () => {
    const { entries } = buildJournal({
      memories: [{ id: 1, dna: 7, ts: ts(2026, 6, 18), title: 'Passed exam', note: 'so relieved' }],
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: 'memory', title: 'Passed exam', detail: 'so relieved', dna: 7 })
  })

  it('includes spirits discovered live and routes retroactive (null) ones to undated', () => {
    const { entries, undated } = buildJournal({
      spirits: {
        unlocked: { curiosity: true, persistence: true },
        discoveredAt: { curiosity: ts(2026, 6, 10), persistence: null },
      },
    })
    expect(entries.map((e) => e.spiritId)).toEqual(['curiosity'])
    expect(entries[0].title).toMatch(new RegExp(SPIRITS_BY_ID.curiosity.name, 'i'))
    expect(undated.map((e) => e.spiritId)).toEqual(['persistence'])
    expect(undated[0].ts).toBeUndefined() // no fabricated date
  })

  it('converts grove date-strings to a sortable local-midnight ts', () => {
    const sp = SPECIES[0]
    const { entries } = buildJournal({ grove: { unlocked: { [sp.id]: '2026-06-15' } } })
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: 'varietal', dna: dnaOf(sp) })
    expect(entries[0].ts).toBe(new Date(2026, 5, 15).getTime())
  })

  it('includes reflections with a note but skips mood-only check-ins', () => {
    const { entries } = buildJournal({
      reflections: [
        { ts: ts(2026, 6, 17), mood: 'sun', note: 'felt good today' },
        { ts: ts(2026, 6, 16), mood: 'rain', note: '' }, // mood only → skipped
      ],
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ kind: 'reflection', detail: 'felt good today' })
  })

  it('labels kept verses vs plain letters', () => {
    const { entries } = buildJournal({
      keepsakes: [
        { id: 'a', text: 'For God so loved...', ref: 'John 3:16', type: 'scripture', ts: ts(2026, 6, 14) },
        {
          id: 'b',
          text: 'You are doing better than you think.',
          ref: null,
          type: 'original',
          ts: ts(2026, 6, 13),
        },
      ],
    })
    const titles = entries.map((e) => e.title)
    expect(titles).toContain('You kept a verse — John 3:16')
    expect(titles).toContain('You kept a letter')
  })

  it('emits growth milestones at the Nth harvested tree, dated to that tree', () => {
    const garden = Array.from({ length: 10 }, (_, i) => ({ id: i, ts: ts(2026, 6, 1) + i * 86400000 }))
    const { entries } = buildJournal({ garden })
    const milestones = entries.filter((e) => e.kind === 'milestone')
    // Thresholds 1 and 10 are reached (25+ are not).
    expect(milestones.map((m) => m.title)).toEqual(
      expect.arrayContaining(['You grew your first tree', 'You grew your 10th tree']),
    )
    const tenth = milestones.find((m) => m.title.includes('10th'))
    expect(tenth.ts).toBe(garden[9].ts)
    expect(MILESTONES[0]).toBe(1)
  })

  it('sorts all entries newest-first', () => {
    const { entries } = buildJournal({
      memories: [
        { id: 1, dna: 0, ts: ts(2026, 6, 1), title: 'older' },
        { id: 2, dna: 0, ts: ts(2026, 6, 20), title: 'newer' },
      ],
    })
    expect(entries.map((e) => e.title)).toEqual(['newer', 'older'])
  })

  it('returns empty groups for empty input', () => {
    expect(buildJournal({})).toEqual({ entries: [], undated: [] })
    expect(buildJournal()).toEqual({ entries: [], undated: [] })
  })
})

describe('searchJournal', () => {
  const { entries } = buildJournal({
    memories: [
      { id: 1, dna: 0, ts: ts(2026, 6, 18), title: 'Passed exam', note: 'biology' },
      { id: 2, dna: 0, ts: ts(2026, 6, 10), title: 'Hard day', note: 'kept going' },
    ],
  })

  it('returns all entries for an empty query', () => {
    expect(searchJournal(entries, '')).toHaveLength(2)
    expect(searchJournal(entries, '   ')).toHaveLength(2)
  })

  it('matches title or detail, case-insensitively', () => {
    expect(searchJournal(entries, 'EXAM').map((e) => e.title)).toEqual(['Passed exam'])
    expect(searchJournal(entries, 'going').map((e) => e.title)).toEqual(['Hard day'])
    expect(searchJournal(entries, 'zzz')).toEqual([])
  })
})
