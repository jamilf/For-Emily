// Journal — a DERIVED, read-only timeline. It owns no state of its own: it weaves
// the data the app already stores (memories, spirit discoveries, varietal unlocks,
// kept letters, written reflections, growth milestones) into one reverse-
// chronological list of meaningful moments. No persistence, no sync, no migration.
//
// History is never fabricated: spirits unlocked retroactively (discoveredAt === null)
// have no real date, so they go in a separate `undated` group shown with a plain "—".

import { SPIRITS_BY_ID } from './spirits.js'
import { SPECIES_BY_ID, dnaOf } from './grove.js'

// The tree-count milestones worth remembering (the Nth harvested tree).
export const MILESTONES = [1, 10, 25, 50, 100, 150, 200, 300, 400, 500]

const MOOD_ICON = { rain: '🌧️', cloud: '🌤️', sun: '☀️' }

/** Local-midnight epoch ms for a 'YYYY-MM-DD' string (grove stamps date strings). */
function dateStrToTs(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).getTime()
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function snippet(text, n = 90) {
  const t = (text || '').trim()
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

/**
 * Build the journal from the existing stores.
 * @returns {{ entries: object[], undated: object[] }} entries sorted newest-first.
 */
export function buildJournal({
  memories = [],
  spirits = {},
  grove = {},
  garden = [],
  keepsakes = [],
  reflections = [],
} = {}) {
  const entries = []
  const discoveredAt = spirits.discoveredAt || {}
  const unlocked = spirits.unlocked || {}

  // Memories — the most personal moments.
  for (const m of memories) {
    if (!m || m.ts == null) continue
    entries.push({
      key: `memory-${m.id}`,
      ts: m.ts,
      kind: 'memory',
      icon: '📖',
      title: m.title || 'A dedicated memory',
      detail: m.note || '',
      dna: m.dna,
    })
  }

  // Spirit discoveries (dated only; retroactive ones go to `undated` below).
  for (const id of Object.keys(unlocked)) {
    if (discoveredAt[id] == null) continue
    entries.push({
      key: `spirit-${id}`,
      ts: discoveredAt[id],
      kind: 'spirit',
      icon: '✨',
      title: `${SPIRITS_BY_ID[id]?.name || id} found you`,
      detail: 'A new forest spirit joined your grove.',
      spiritId: id,
    })
  }

  // Varietal unlocks — grove stores a 'YYYY-MM-DD' date string per id.
  for (const [id, dateStr] of Object.entries(grove.unlocked || {})) {
    const sp = SPECIES_BY_ID[id]
    if (!sp || !dateStr) continue
    entries.push({
      key: `varietal-${id}`,
      ts: dateStrToTs(dateStr),
      kind: 'varietal',
      icon: '🌿',
      title: `${sp.name} grew in your grove`,
      detail: sp.flavor || 'A new varietal joined your almanac.',
      dna: dnaOf(sp),
    })
  }

  // Kept letters from the sprite.
  for (const k of keepsakes) {
    if (!k || k.ts == null) continue
    const isVerse = k.type === 'scripture' && k.ref
    entries.push({
      key: `keepsake-${k.id}-${k.ts}`,
      ts: k.ts,
      kind: 'keepsake',
      icon: '💌',
      title: isVerse ? `You kept a verse: ${k.ref}` : 'You kept a letter',
      detail: snippet(k.text),
    })
  }

  // Written reflections only — a mood with no note isn't a journal entry.
  for (const r of reflections) {
    if (!r || r.ts == null || !r.note || !r.note.trim()) continue
    entries.push({
      key: `reflection-${r.ts}`,
      ts: r.ts,
      kind: 'reflection',
      icon: MOOD_ICON[r.mood] || '🌥️',
      title: 'You paused to reflect',
      detail: r.note.trim(),
      mood: r.mood,
    })
  }

  // Growth milestones — the Nth harvested tree, dated to when it was grown.
  const grown = garden.filter((t) => t && t.ts != null).sort((a, b) => a.ts - b.ts)
  for (const n of MILESTONES) {
    if (n > grown.length) break
    const tree = grown[n - 1]
    entries.push({
      key: `milestone-${n}`,
      ts: tree.ts,
      kind: 'milestone',
      icon: '🌳',
      title: n === 1 ? 'You grew your first tree' : `You grew your ${ordinal(n)} tree`,
      detail: n === 1 ? 'The very start of your grove.' : 'Your grove keeps filling in.',
      dna: tree.id,
    })
  }

  entries.sort((a, b) => b.ts - a.ts)

  // Undated: spirits earned retroactively have no real discovery date.
  const undated = []
  for (const id of Object.keys(unlocked)) {
    if (discoveredAt[id] != null) continue
    undated.push({
      key: `spirit-undated-${id}`,
      kind: 'spirit',
      icon: '✨',
      title: `${SPIRITS_BY_ID[id]?.name || id} found you`,
      detail: 'Already with you when your journal began.',
      spiritId: id,
    })
  }

  return { entries, undated }
}

/** Case-insensitive substring filter over an entry's title + detail. */
export function searchJournal(entries = [], query = '') {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) => (e.title || '').toLowerCase().includes(q) || (e.detail || '').toLowerCase().includes(q),
  )
}
