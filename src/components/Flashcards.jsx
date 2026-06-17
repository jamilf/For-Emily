import { useEffect, useMemo, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'
import { SEED_CARDS, makeCard, nextDue, isDue } from '../data/flashcards.js'

/**
 * Active-recall flashcards — a calm, full-screen, one-card-at-a-time overlay.
 * Tap/Enter flips; "Got it" / "Review again" schedule the card with simple
 * spaced repetition. Decks persist to emily.flashcards.
 */
export default function Flashcards({ onClose }) {
  const [cards, setCards] = usePersistedState('emily.flashcards', SEED_CARDS)
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [deck, setDeck] = useState('')
  const closeRef = useRef(null)

  useEscapeKey(onClose)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // The review queue is fixed when the overlay opens: due cards first, and if
  // none are due, the whole set so Emily can still study.
  const queue = useMemo(() => {
    const due = cards.filter(isDue)
    return due.length > 0 ? due : cards
    // Built once on mount; mutations re-schedule without reshuffling underfoot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = queue[index]
  const done = index >= queue.length

  function grade(gotIt) {
    if (!current) return
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== current.id) return c
        const box = gotIt ? c.box + 1 : 0
        return { ...c, box, due: nextDue(box) }
      }),
    )
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  function addCard(e) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setCards((prev) => [...prev, makeCard(front, back, deck)])
    setFront('')
    setBack('')
    setCreating(false)
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-bgDim/80 sm:backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Flashcards"
        className="animate-modal-in relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/40 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🃏 Flashcards
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

        <div className="bg-cream p-6 text-brownDark">
          {creating ? (
            <form onSubmit={addCard} className="space-y-3">
              <p className="font-display text-lg text-brown">New card</p>
              <input
                value={deck}
                onChange={(e) => setDeck(e.target.value)}
                placeholder="Deck (e.g. Neuroscience)"
                className="w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-sm focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <input
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Front (the prompt)"
                autoFocus
                className="w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <input
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Back (the answer)"
                className="w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-2xl bg-brown px-4 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95">
                  Save card
                </button>
                <button type="button" onClick={() => setCreating(false)} className="rounded-2xl bg-brown/10 px-4 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95">
                  Cancel
                </button>
              </div>
            </form>
          ) : done ? (
            <div className="py-8 text-center">
              <p className="font-display text-xl text-brown">All caught up 🌿</p>
              <p className="mt-2 text-sm text-brown/70">
                {cards.length === 0 ? 'Make your first card to begin.' : 'Come back when more are due to review.'}
              </p>
              <button
                onClick={() => setCreating(true)}
                className="mt-5 rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
              >
                ＋ New card
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between text-xs text-brown/60">
                <span>{current.deck}</span>
                <span>
                  {index + 1} / {queue.length}
                </span>
              </div>

              {/* The card — click/Enter to flip */}
              <button
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? 'Show prompt' : 'Reveal answer'}
                className="flex min-h-[10rem] w-full items-center justify-center rounded-2xl border-2 border-brown/20 bg-white/70 p-6 text-center text-lg leading-relaxed transition-colors hover:bg-white active:scale-[0.99]"
              >
                <span>
                  {flipped ? current.back : current.front}
                  <span className="mt-3 block font-display text-xs text-brown/50">
                    {flipped ? 'the answer' : 'tap to reveal'}
                  </span>
                </span>
              </button>

              {/* Announce the visible face + position to screen readers (the card
                  itself is a silent visual flip otherwise). */}
              <p className="sr-only" aria-live="polite">
                {`Card ${index + 1} of ${queue.length}. ${flipped ? `Answer: ${current.back}` : `Prompt: ${current.front}`}`}
              </p>

              {flipped ? (
                <div className="mt-4 flex gap-2 font-display">
                  <button
                    onClick={() => grade(false)}
                    className="flex-1 rounded-2xl bg-brown/10 px-4 py-2.5 text-brown transition-colors hover:bg-brown/20 active:scale-95"
                  >
                    Review again
                  </button>
                  <button
                    onClick={() => grade(true)}
                    className="flex-1 rounded-2xl bg-ever-green px-4 py-2.5 text-bg0 transition-colors hover:brightness-95 active:scale-95"
                  >
                    Got it 🌿
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-center text-sm text-brown/60">Recall it, then tap the card.</p>
              )}

              <div className="mt-5 text-center">
                <button
                  onClick={() => setCreating(true)}
                  className="font-display text-xs text-brown/70 underline-offset-2 hover:underline"
                >
                  ＋ New card
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
