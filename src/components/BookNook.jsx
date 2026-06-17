import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'emily.books'

function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Widget 1 — The Book Nook.
 * Notebook-paper "Current Reads" list. One field + Enter (or the + button on
 * mobile) to add. Persists to localStorage.
 */
export default function BookNook() {
  const [books, setBooks] = useState(loadBooks)
  const [draft, setDraft] = useState('')
  // Track which book was just added so it gets the slide-up entrance.
  const [newestId, setNewestId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
    } catch {
      /* ignore quota errors */
    }
  }, [books])

  function addBook(e) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    const id = Date.now() + Math.random()
    setNewestId(id)
    setBooks((prev) => [...prev, { id, title, done: false }])
    setDraft('')
    inputRef.current?.focus()
  }

  function toggleBook(id) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, done: !b.done } : b)),
    )
  }

  function deleteBook(id) {
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <section
      aria-label="The Book Nook"
      className="widget-glass relative overflow-hidden bg-cream/95 p-6 pt-10 text-brownDark transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.015]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 31px, rgba(143,94,54,0.15) 31px, rgba(143,94,54,0.15) 32px)',
        backgroundPositionY: '2.75rem',
      }}
    >
      {/* Washi-tape detail */}
      <div
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-8 w-32 -translate-x-1/2 rotate-[-2.5deg] rounded-sm bg-ever-aqua/75 shadow-sm"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 7px)',
        }}
      />

      <h2 className="mb-0.5 font-serif text-2xl font-semibold">
        The Book Nook <span aria-hidden="true">📖</span>
      </h2>
      <p className="mb-4 text-sm text-brown">Current reads</p>

      {/* Input + submit button side by side for mobile-friendly adding. */}
      <form onSubmit={addBook} className="mb-4 flex gap-2">
        <label htmlFor="book-input" className="sr-only">
          Add a book title
        </label>
        <input
          id="book-input"
          ref={inputRef}
          type="text"
          inputMode="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a title…"
          className="min-w-0 flex-1 rounded-2xl border border-brown/20 bg-white/60 px-4 py-2.5 text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
        />
        <button
          type="submit"
          aria-label="Add book"
          className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-2xl bg-brown/15 text-xl text-brown transition-colors hover:bg-brown/30 active:scale-95"
        >
          +
        </button>
      </form>

      {books.length === 0 ? (
        <p className="rounded-2xl bg-white/50 px-4 py-6 text-center text-sm text-brown">
          Your shelf is waiting 🌼
          <br />
          Add the book you&apos;re reading to begin.
        </p>
      ) : (
        <ul className="space-y-1">
          {books.map((book) => (
            <li
              key={book.id}
              className={`group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/50 ${
                book.id === newestId ? 'animate-slide-up' : ''
              }`}
              style={book.id === newestId ? { animationDuration: '0.3s' } : {}}
            >
              <label className="flex min-h-[32px] flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={book.done}
                  onChange={() => toggleBook(book.id)}
                  className="h-5 w-5 flex-shrink-0 cursor-pointer rounded accent-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
                />
                <span
                  className={`transition-all duration-200 ${
                    book.done ? 'text-brown/55 line-through' : 'text-brownDark'
                  }`}
                >
                  {book.title}
                </span>
              </label>

              {/*
               * Delete button:
               * - Mobile: always visible (touch has no hover state)
               * - Desktop: hidden until the row is hovered / button is focused
               */}
              <button
                type="button"
                onClick={() => deleteBook(book.id)}
                aria-label={`Remove ${book.title}`}
                className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded-full text-center text-brown/60 transition-all duration-150 hover:text-ever-red active:scale-90 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
