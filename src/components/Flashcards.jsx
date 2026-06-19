import { useEffect, useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import {
  SEED_CARDS,
  RATINGS,
  makeCard,
  makeStats,
  gradeCard,
  nextIntervalLabel,
  sessionQueue,
  decksOf,
  countDue,
  masteredCount,
  retentionPct,
  recordReview,
  parseBulk,
} from '../data/flashcards.js'
import { pickByContext } from '../data/encouragements.js'

const RATING_STYLES = {
  again: 'bg-ever-red/20 text-brown hover:bg-ever-red/30',
  hard: 'bg-ever-orange/20 text-brown hover:bg-ever-orange/30',
  good: 'bg-ever-green/25 text-bg0 hover:brightness-95',
  easy: 'bg-ever-aqua/30 text-bg0 hover:brightness-95',
}
const RATING_LABELS = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' }

/**
 * Active-recall flashcards — a calm, full-screen, one-card-at-a-time overlay
 * built on Leitner spaced repetition. Recall first, then rate Again/Hard/Good/
 * Easy (keys 1–4); sessions are capped with a progress bar so they always end.
 * Decks + scheduling persist to emily.flashcards / emily.flashcardStats.
 */
export default function Flashcards({ onClose }) {
  const [cards, setCards] = usePersistedState('emily.flashcards', SEED_CARDS)
  const [stats, setStats] = usePersistedState('emily.flashcardStats', makeStats())
  const [verses] = usePersistedState('emily.verses', {})

  const [view, setView] = useState('home') // home | study | done | add | bulk | stats
  const [deck, setDeck] = useState(null) // selected deck (null = All)
  const [cap, setCap] = useState(12)
  const [shuffle, setShuffle] = useState(true)

  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [nudge, setNudge] = useState(null)
  const [doneMsg, setDoneMsg] = useState('')

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [newDeck, setNewDeck] = useState('')
  const [bulk, setBulk] = useState('')
  const [bulkDeck, setBulkDeck] = useState('')

  const closeRef = useRef(null)
  const frontRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const decks = useMemo(() => decksOf(cards), [cards])
  const dueTotal = useMemo(() => countDue(cards), [cards])
  const mastered = useMemo(() => masteredCount(cards), [cards])
  const retention = retentionPct(stats)

  // Preview the queue for the current options (also reused when starting).
  const preview = useMemo(() => sessionQueue(cards, { cap, shuffle, deck }), [cards, cap, shuffle, deck])
  const current = queue[idx]

  function pickEncouragement(context) {
    const r = pickByContext(context, { seen: [], verses })
    return r.text || 'Well done, Emily. That counted.'
  }

  function startSession() {
    if (preview.length === 0) return
    setQueue(preview)
    setIdx(0)
    setFlipped(false)
    setNudge(null)
    setView('study')
  }

  function grade(rating) {
    if (!current) return
    const updated = gradeCard(current, rating)
    setCards((prev) => prev.map((c) => (c.id === current.id ? updated : c)))
    setStats((prev) => recordReview(prev, rating))

    const nextIdx = idx + 1
    if (nextIdx < queue.length) {
      setFlipped(false)
      // A gentle soot-sprite nudge every few cards (celebration/strength lean).
      setNudge(nextIdx % 5 === 0 ? pickEncouragement('complete') : null)
      setIdx(nextIdx)
    } else {
      setDoneMsg(pickEncouragement('complete'))
      setView('done')
    }
  }

  // Keyboard: Space flips; 1–4 rate once the answer is showing.
  useEffect(() => {
    if (view !== 'study') return
    function onKey(e) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        setFlipped((f) => !f)
        return
      }
      if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        grade(RATINGS[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, flipped, idx, queue])

  function addCard(e) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setCards((prev) => [...prev, makeCard(front, back, newDeck)])
    setFront('')
    setBack('')
    frontRef.current?.focus() // keep going — rapid entry
  }

  function importBulk(e) {
    e.preventDefault()
    const parsed = parseBulk(bulk, bulkDeck)
    if (parsed.length === 0) return
    setCards((prev) => [...prev, ...parsed])
    setBulk('')
    setView('home')
  }

  const titleBar = (label) => (
    <div
      className="flex items-center justify-between gap-2 border-b-2 border-brownDark/40 px-3 py-2"
      style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
    >
      <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
        {label}
      </span>
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close flashcards"
        className="rounded-full px-2 text-cream/90 transition-colors hover:text-cream active:scale-90"
      >
        ✕
      </button>
    </div>
  )

  const chip =
    'rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow'
  const inputCls =
    'w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-sm focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow'

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/80 sm:backdrop-blur-sm"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Flashcards"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        {/* ── Home / deck picker ─────────────────────────────────────────── */}
        {view === 'home' && (
          <>
            {titleBar('🃏 Flashcards')}
            <div className="overflow-y-auto bg-cream p-6 text-brownDark">
              {cards.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-display text-xl text-brown">No cards yet.</p>
                  <p className="mt-2 text-sm text-brown/70">
                    Make your first card or paste a batch to begin.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button
                      onClick={() => setView('add')}
                      className="rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                    >
                      ＋ New card
                    </button>
                    <button
                      onClick={() => setView('bulk')}
                      className="rounded-2xl bg-brown/10 px-5 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                    >
                      ⬆ Import
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-xl text-brown">
                    {dueTotal > 0
                      ? `${dueTotal} card${dueTotal === 1 ? '' : 's'} due today`
                      : 'Nothing due right now'}
                  </p>
                  <p className="mt-1 text-xs text-brown/60">
                    Recalling from memory — not rereading — is what builds lasting memory. Spacing reviews
                    over days moves it into long-term storage.
                  </p>

                  {/* Deck picker */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDeck(null)}
                      aria-pressed={deck === null}
                      className={`${chip} ${deck === null ? 'border-sunset-magenta bg-sunset-pink/30' : 'border-brown/15 bg-white/60'}`}
                    >
                      <span className="font-display">All decks</span>
                      <span className="mt-0.5 block text-xs text-brown/60">
                        {dueTotal} due · {cards.length} total
                      </span>
                    </button>
                    {decks.map((d) => (
                      <button
                        key={d.deck}
                        onClick={() => setDeck(d.deck)}
                        aria-pressed={deck === d.deck}
                        className={`${chip} ${deck === d.deck ? 'border-sunset-magenta bg-sunset-pink/30' : 'border-brown/15 bg-white/60'}`}
                      >
                        <span className="font-display">{d.deck}</span>
                        <span className="mt-0.5 block text-xs text-brown/60">
                          {d.due} due · {d.total} total
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Session options */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brown/80">
                    <div className="flex items-center gap-2">
                      <span>Session size</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCap((c) => Math.max(4, c - 4))}
                          aria-label="Fewer cards"
                          className="h-7 w-7 rounded-lg bg-brown/10 font-display hover:bg-brown/20 active:scale-95"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-display tabular-nums">{cap}</span>
                        <button
                          onClick={() => setCap((c) => Math.min(40, c + 4))}
                          aria-label="More cards"
                          className="h-7 w-7 rounded-lg bg-brown/10 font-display hover:bg-brown/20 active:scale-95"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shuffle}
                        onChange={(e) => setShuffle(e.target.checked)}
                        className="h-4 w-4 accent-sunset-magenta"
                      />
                      Shuffle
                    </label>
                  </div>

                  <button
                    onClick={startSession}
                    disabled={preview.length === 0}
                    className="mt-5 w-full rounded-2xl bg-brown px-5 py-3 font-display text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-40"
                  >
                    {preview.length > 0
                      ? `Review ${preview.length} card${preview.length === 1 ? '' : 's'}`
                      : 'Nothing to review'}
                  </button>

                  <div className="mt-4 flex justify-center gap-4 font-display text-xs text-brown/70">
                    <button onClick={() => setView('add')} className="underline-offset-2 hover:underline">
                      ＋ New card
                    </button>
                    <button onClick={() => setView('bulk')} className="underline-offset-2 hover:underline">
                      ⬆ Import
                    </button>
                    <button onClick={() => setView('stats')} className="underline-offset-2 hover:underline">
                      📊 Progress
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Study ──────────────────────────────────────────────────────── */}
        {view === 'study' && current && (
          <>
            {titleBar('🃏 Reviewing')}
            <div className="overflow-y-auto bg-cream p-6 text-brownDark">
              {/* Progress */}
              <div className="mb-1 flex items-center justify-between text-xs text-brown/60">
                <span>{current.deck}</span>
                <span>
                  Reviewing {idx + 1} of {queue.length}
                </span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-brown/10">
                <div
                  className="h-full rounded-full bg-ever-green transition-[width] duration-300"
                  style={{ width: `${Math.round((idx / queue.length) * 100)}%` }}
                />
              </div>

              {nudge && (
                <p
                  className="mb-3 rounded-xl bg-ever-green/15 px-3 py-2 text-center text-sm text-brown"
                  aria-live="polite"
                >
                  {nudge}
                </p>
              )}

              {/* The flip card */}
              <div className="flip-card">
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  aria-label={flipped ? 'Show prompt' : 'Reveal answer'}
                  className="block w-full text-left"
                >
                  <div className={`flip-inner ${flipped ? 'is-flipped' : ''} min-h-[11rem]`}>
                    <div className="flip-face flex min-h-[11rem] w-full items-center justify-center rounded-2xl border-2 border-brown/20 bg-white/70 p-6 text-center text-lg leading-relaxed">
                      <span>
                        {current.front}
                        <span className="mt-3 block font-display text-xs text-brown/45">
                          try to answer from memory first…
                        </span>
                      </span>
                    </div>
                    <div className="flip-back flex min-h-[11rem] w-full items-center justify-center rounded-2xl border-2 border-brown/20 bg-latte p-6 text-center text-lg leading-relaxed">
                      <span>{current.back}</span>
                    </div>
                  </div>
                </button>
              </div>

              <p className="sr-only" aria-live="polite">
                {`Card ${idx + 1} of ${queue.length}. ${flipped ? `Answer: ${current.back}` : `Prompt: ${current.front}`}`}
              </p>

              {!flipped ? (
                <button
                  onClick={() => setFlipped(true)}
                  className="mt-4 w-full rounded-2xl bg-brown px-4 py-3 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Show answer <span className="text-cream/60">(space)</span>
                </button>
              ) : (
                <div className="mt-4">
                  <p className="mb-2 text-center text-xs text-brown/55">How well did you recall it?</p>
                  <div className="grid grid-cols-2 gap-2 font-display sm:grid-cols-4">
                    {RATINGS.map((r, i) => (
                      <button
                        key={r}
                        onClick={() => grade(r)}
                        className={`flex min-h-[3.25rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-sm transition-all active:scale-95 ${RATING_STYLES[r]}`}
                      >
                        <span>
                          {i + 1}. {RATING_LABELS[r]}
                        </span>
                        <span className="text-[0.65rem] font-normal opacity-70">
                          {nextIntervalLabel(current, r)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 text-center">
                <button
                  onClick={() => setView('home')}
                  className="font-display text-xs text-brown/60 underline-offset-2 hover:underline"
                >
                  End session
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Completion ─────────────────────────────────────────────────── */}
        {view === 'done' && (
          <>
            {titleBar('🃏 Flashcards')}
            <div className="overflow-y-auto bg-cream p-6 text-center text-brownDark">
              <p className="font-display text-2xl text-brown">deck cleared 🌿</p>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-brown/80">{doneMsg}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-brown/70">
                <span>🍃 {stats.reviewedToday || 0} reviewed today</span>
                <span>🌳 {mastered} mastered</span>
                {retention != null && <span>🧠 {retention}% recalled</span>}
              </div>
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setView('home')}
                  className="rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Back to decks
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl bg-brown/10 px-5 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Add card ───────────────────────────────────────────────────── */}
        {view === 'add' && (
          <>
            {titleBar('🃏 New card')}
            <form onSubmit={addCard} className="space-y-3 overflow-y-auto bg-cream p-6 text-brownDark">
              <input
                value={newDeck}
                onChange={(e) => setNewDeck(e.target.value)}
                placeholder="Deck (e.g. Neuroscience)"
                className={inputCls}
              />
              <input
                ref={frontRef}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Front — keep it brief: one concept per card"
                autoFocus
                className={inputCls}
              />
              <input
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Back — the answer (Enter to save)"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-brown px-4 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Save & add another
                </button>
                <button
                  type="button"
                  onClick={() => setView('home')}
                  className="rounded-2xl bg-brown/10 px-4 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Done
                </button>
              </div>
              <p className="text-center text-xs text-brown/50">
                Tip: Front → Tab → Back → Enter to fly through them.
              </p>
            </form>
          </>
        )}

        {/* ── Bulk import ────────────────────────────────────────────────── */}
        {view === 'bulk' && (
          <>
            {titleBar('🃏 Import cards')}
            <form onSubmit={importBulk} className="space-y-3 overflow-y-auto bg-cream p-6 text-brownDark">
              <input
                value={bulkDeck}
                onChange={(e) => setBulkDeck(e.target.value)}
                placeholder="Deck for these cards"
                className={inputCls}
              />
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={8}
                placeholder={'One card per line:\nterm — definition\nhippocampus — forms new memories'}
                autoFocus
                className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-brown px-4 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Add cards
                </button>
                <button
                  type="button"
                  onClick={() => setView('home')}
                  className="rounded-2xl bg-brown/10 px-4 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Progress / stats ───────────────────────────────────────────── */}
        {view === 'stats' && (
          <>
            {titleBar('🃏 Your progress')}
            <div className="overflow-y-auto bg-cream p-6 text-brownDark">
              <div className="grid grid-cols-2 gap-3">
                <Stat icon="🍃" value={stats.reviewedToday || 0} label="reviewed today" />
                <Stat icon="🔥" value={stats.streak || 0} label="day streak" />
                <Stat icon="🌳" value={mastered} label="cards mastered" />
                <Stat
                  icon="🧠"
                  value={retention != null ? `${retention}%` : '—'}
                  label="recalled (retention)"
                />
              </div>
              <p className="mt-4 text-center text-xs text-brown/55">
                Missed a day? No worries — the streak just starts again, gently. Showing up is the whole win.
              </p>
              <button
                onClick={() => setView('home')}
                className="mt-5 w-full rounded-2xl bg-brown/10 px-4 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, value, label }) {
  return (
    <div className="rounded-xl bg-brown/5 px-3 py-3 text-center">
      <div className="font-display text-2xl text-brown">
        <span aria-hidden="true">{icon} </span>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-brown/60">{label}</div>
    </div>
  )
}
