import { useMemo, useRef, useState } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import ProceduralTree from './ProceduralTree.jsx'
import { speciesForDna } from '../data/grove.js'
import { createMemory, updateMemory, deleteMemory, searchMemories } from '../data/memories.js'

const inputCls =
  'w-full rounded-xl border-2 border-brown/20 bg-white/70 p-2.5 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow'

function speciesLabel(dna) {
  const s = speciesForDna(dna)
  return s ? s.name : 'Wild varietal'
}
function speciesFlavor(dna) {
  const s = speciesForDna(dna)
  return s ? s.flavor : 'A tree you grew, one focused session at a time.'
}
function formatDay(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Memory Grove — dedicate any harvested tree as a permanent, captioned keepsake.
 * Each memory renders with the SHARED ProceduralTree (no alternate renderer). A
 * lazy modal matching the app's overlay chrome (focus trap, backdrop, Esc, return-
 * focus), with three keyboard-accessible views: the searchable list, a tree picker,
 * and a create/edit form. State is conveyed by text + shape, never colour alone.
 */
export default function MemoryGroveModal({ onClose }) {
  const [memories, setMemories] = usePersistedState('emily.memories', [])
  const [garden] = usePersistedState('emily.garden', [])

  const [view, setView] = useState('list') // 'list' | 'pick' | 'form'
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(null) // { id|null, dna, ts, title, note }
  const [confirmId, setConfirmId] = useState(null)
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => searchMemories(memories, search), [memories, search])

  // Trees in the garden that haven't been dedicated yet (deduped by harvest ts).
  const undedicated = useMemo(() => {
    const taken = new Set(memories.map((m) => m.ts))
    return garden.filter((t) => !taken.has(t.ts))
  }, [garden, memories])

  function startCreate(tree) {
    setDraft({ id: null, dna: tree.id, ts: tree.ts, title: '', note: '' })
    setView('form')
  }
  function startEdit(memory) {
    setDraft({ ...memory })
    setView('form')
  }
  function saveDraft() {
    if (!draft || !draft.title.trim()) return
    if (draft.id == null) {
      setMemories((list) => createMemory(list, draft))
      setStatus(`Memory "${draft.title.trim()}" dedicated.`)
    } else {
      setMemories((list) => updateMemory(list, draft.id, draft))
      setStatus(`Memory "${draft.title.trim()}" updated.`)
    }
    setDraft(null)
    setView('list')
  }
  function removeMemory(memory) {
    setMemories((list) => deleteMemory(list, memory.id))
    setConfirmId(null)
    setStatus(`Memory "${memory.title}" removed.`)
  }

  return (
    <GameWindow
      modal
      title="🌳 Memory Grove"
      ariaLabel="Memory Grove"
      onClose={onClose}
      closeLabel="Close memory grove"
      widthClass="max-w-2xl"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      {/* Polite status for screen readers on save/remove. */}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {view === 'form' && draft ? (
        <MemoryForm
          draft={draft}
          onChange={setDraft}
          onSave={saveDraft}
          onCancel={() => {
            setDraft(null)
            setView('list')
          }}
        />
      ) : view === 'pick' ? (
        <div className="space-y-4">
          <button
            onClick={() => setView('list')}
            className="font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ← Back to memories
          </button>
          <p className="font-display text-lg text-brown">Dedicate a tree</p>
          {undedicated.length === 0 ? (
            <p className="text-sm text-brown/70">
              {garden.length === 0
                ? 'Finish a focus session to grow a tree, then you can dedicate it here.'
                : 'Every tree in your garden already holds a memory. 🌿'}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {undedicated.map((tree) => (
                <li key={tree.ts}>
                  <button
                    onClick={() => startCreate(tree)}
                    aria-label={`Dedicate the ${speciesLabel(tree.id)} grown ${formatDay(tree.ts)}`}
                    className="flex h-full w-full flex-col items-center gap-1 rounded-2xl border-2 border-brown/15 bg-white/55 p-2 text-center transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ever-yellow"
                  >
                    <ProceduralTree dna={tree.id} stage="mature" pixel={3} />
                    <span className="text-[0.65rem] text-brown/60">{formatDay(tree.ts)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg text-brown">
              {memories.length === 0
                ? 'Your memory grove'
                : `${memories.length} ${memories.length === 1 ? 'memory' : 'memories'} kept`}
            </p>
            <button
              onClick={() => setView('pick')}
              className="rounded-2xl bg-brown px-3 py-1.5 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
            >
              ＋ Dedicate a tree
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your memories…"
            aria-label="Search memories"
            className={inputCls}
          />

          {memories.length === 0 ? (
            <p className="text-sm text-brown/70">
              Dedicate a tree to remember a moment: a finished assignment, a hard day you got through, a small
              win. It stays here for good.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-brown/70" aria-live="polite">
              No memories match “{search}”.
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((memory) => (
                <li
                  key={memory.id}
                  className="flex gap-3 rounded-2xl border-2 border-brown/15 bg-white/55 p-3"
                >
                  <ProceduralTree dna={memory.dna} stage="mature" pixel={4} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-brown">{memory.title}</p>
                    {memory.note && <p className="mt-0.5 text-sm text-brown/75">{memory.note}</p>}
                    <p className="mt-1 text-xs text-brown/55">
                      {speciesLabel(memory.dna)} · grown {formatDay(memory.ts)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {confirmId === memory.id ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="text-brown/60">Remove this memory?</span>
                          <button
                            onClick={() => removeMemory(memory)}
                            className="rounded-lg bg-ever-red/15 px-2 py-1 font-display text-brown transition-colors hover:bg-ever-red/25 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg px-2 py-1 text-brown/60 underline-offset-2 hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            Keep
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(memory)}
                            aria-label={`Edit memory ${memory.title}`}
                            className="rounded-lg bg-brown/10 px-2 py-1 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmId(memory.id)}
                            aria-label={`Delete memory ${memory.title}`}
                            className="rounded-lg bg-ever-red/15 px-2 py-1 font-display text-xs text-brown transition-colors hover:bg-ever-red/25 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </GameWindow>
  )
}

function MemoryForm({ draft, onChange, onSave, onCancel }) {
  const titleRef = useRef(null)
  return (
    <div className="space-y-4">
      <button
        onClick={onCancel}
        className="font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        ← Back to memories
      </button>

      <div className="flex items-center gap-3">
        <ProceduralTree dna={draft.dna} stage="mature" pixel={4} />
        <div>
          <p className="font-display text-brown">{speciesLabel(draft.dna)}</p>
          <p className="text-xs text-brown/60">grown {formatDay(draft.ts)}</p>
          <p className="mt-0.5 text-xs text-brown/55">{speciesFlavor(draft.dna)}</p>
        </div>
      </div>

      <div>
        <label htmlFor="memory-title" className="mb-1 block text-xs text-brown/70">
          Title
        </label>
        <input
          id="memory-title"
          ref={titleRef}
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="Finished my assignment"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="memory-note" className="mb-1 block text-xs text-brown/70">
          Note (optional)
        </label>
        <textarea
          id="memory-note"
          value={draft.note}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
          rows={4}
          placeholder="What made this one worth keeping?"
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!draft.title.trim()}
          className="flex-1 rounded-xl bg-brown px-3 py-2 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-50"
        >
          {draft.id == null ? 'Dedicate this tree' : 'Save changes'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl bg-brown/10 px-3 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
