// Memory Grove — pure helpers behind the dedicated-tree keepsakes. A memory is a
// harvested tree (identified by its DNA + harvest timestamp) that Emily has given a
// title and a note. No I/O here; the component owns persistence via usePersistedState.
//
// Shape of emily.memories: [{ id, dna, ts, title, note }]
//   • dna   — the tree's DNA (renders via the shared ProceduralTree)
//   • ts    — the tree's harvest timestamp (epoch ms; identifies the garden entry)
//   • title — short label ("Passed exam")
//   • note  — a longer reflection

/** New unique id — matches the app's convention (see flashcards makeCard). */
function makeId() {
  return Date.now() + Math.random()
}

/**
 * Dedicate a tree: append a new memory, returning a NEW list (never mutates input).
 * Title/note are trimmed. `dna` and `ts` come from the chosen garden tree.
 */
export function createMemory(list = [], { dna, ts, title = '', note = '' } = {}) {
  const memory = { id: makeId(), dna, ts, title: title.trim(), note: note.trim() }
  return [...list, memory]
}

/** Update a memory's title/note by id, returning a new list. Unknown id = no change. */
export function updateMemory(list = [], id, { title = '', note = '' } = {}) {
  return list.map((m) => (m.id === id ? { ...m, title: title.trim(), note: note.trim() } : m))
}

/** Remove a memory by id, returning a new list. */
export function deleteMemory(list = [], id) {
  return list.filter((m) => m.id !== id)
}

/**
 * Filter memories by a case-insensitive substring across title + note. An empty
 * (or whitespace) query returns the list unchanged.
 */
export function searchMemories(list = [], query = '') {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (m) => (m.title || '').toLowerCase().includes(q) || (m.note || '').toLowerCase().includes(q),
  )
}
