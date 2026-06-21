import { describe, it, expect } from 'vitest'
import { createMemory, updateMemory, deleteMemory, searchMemories } from './memories.js'

const tree = { dna: 42, ts: 1_700_000_000_000 }

describe('createMemory', () => {
  it('appends a trimmed memory with an id, without mutating the input', () => {
    const list = []
    const next = createMemory(list, { ...tree, title: '  Passed exam  ', note: '  so relieved ' })
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ dna: 42, ts: tree.ts, title: 'Passed exam', note: 'so relieved' })
    expect(next[0].id).toBeDefined()
    expect(list).toHaveLength(0) // original untouched
  })

  it('gives each memory a distinct id', () => {
    let list = []
    list = createMemory(list, { ...tree, title: 'a' })
    list = createMemory(list, { ...tree, title: 'b' })
    expect(list[0].id).not.toBe(list[1].id)
  })

  it('defaults missing title/note to empty strings', () => {
    const [m] = createMemory([], { ...tree })
    expect(m).toMatchObject({ title: '', note: '' })
  })
})

describe('updateMemory', () => {
  it('updates the matching memory by id (trimmed) and leaves others alone', () => {
    const list = createMemory([], { ...tree, title: 'old', note: 'x' })
    const id = list[0].id
    const next = updateMemory(list, id, { title: '  new title ', note: ' new note ' })
    expect(next[0]).toMatchObject({ id, title: 'new title', note: 'new note', dna: 42 })
  })

  it('is a no-op for an unknown id and does not mutate', () => {
    const list = createMemory([], { ...tree, title: 'keep' })
    const next = updateMemory(list, 'nope', { title: 'x', note: 'y' })
    expect(next[0].title).toBe('keep')
    expect(next).not.toBe(list)
  })
})

describe('deleteMemory', () => {
  it('removes the matching memory and returns a new list', () => {
    let list = createMemory([], { ...tree, title: 'a' })
    list = createMemory(list, { ...tree, title: 'b' })
    const removeId = list[0].id
    const next = deleteMemory(list, removeId)
    expect(next).toHaveLength(1)
    expect(next.find((m) => m.id === removeId)).toBeUndefined()
  })
})

describe('searchMemories', () => {
  const list = [
    { id: 1, dna: 1, ts: 1, title: 'Passed exam', note: 'biology final' },
    { id: 2, dna: 2, ts: 2, title: 'Hard day', note: 'kept going anyway' },
  ]

  it('returns everything for an empty or whitespace query', () => {
    expect(searchMemories(list, '')).toHaveLength(2)
    expect(searchMemories(list, '   ')).toHaveLength(2)
  })

  it('matches title or note, case-insensitively', () => {
    expect(searchMemories(list, 'EXAM')).toEqual([list[0]])
    expect(searchMemories(list, 'going')).toEqual([list[1]])
    expect(searchMemories(list, 'biology')).toEqual([list[0]])
  })

  it('returns an empty list when nothing matches', () => {
    expect(searchMemories(list, 'zzz')).toEqual([])
  })
})
