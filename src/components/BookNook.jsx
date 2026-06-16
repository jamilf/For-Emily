import { useEffect, useState } from 'react'

const STORAGE_KEY = 'emily.books'

/** Safely read the saved list; never throw if storage is empty/corrupt. */
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
 * A notebook-paper "Current Reads" list. One field + Enter to add (low friction).
 * Persists to localStorage so the list survives refreshes.
 */
export default function BookNook() {
  const [books, setBooks] = useState(loadBooks)
  const [draft, setDraft] = useState('')

  // Save on every change. Wrapped so a full storage quota never crashes the app.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
    } catch {
      /* ignore write errors — the list still works for this session */
    }
  }, [books])

  function addBook(e) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setBooks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), title, done: false },
    ])
    setDraft('')
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
      // Notebook paper: ruled lines via a repeating gradient over cream.
      className="relative overflow-hidden rounded-3xl bg-cream p-6 pt-9 text-brownDark shadow-cozy"
      style={{
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 31px, rgba(143,94,54,0.18) 31px, rgba(143,94,54,0.18) 32px)',
        backgroundPositionY: '2.5rem',
      }}
    >
      {/* Washi-tape detail */}
      <div
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-7 w-28 -translate-x-1/2 rotate-[-3deg] rounded-sm bg-ever-aqua/70 shadow-sm"
      />

      <h2 className="mb-1 font-serif text-2xl font-semibold">
        The Book Nook <span aria-hidden="true">📖</span>
      </h2>
      <p className="mb-4 text-sm text-brown">Current reads</p>

      <form onSubmit={addBook} className="mb-4">
        <label htmlFor="book-input" className="sr-only">
          Add a book title
        </label>
        <input
          id="book-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a title, then press Enter…"
          className="w-full rounded-2xl border border-brown/20 bg-white/60 px-4 py-2.5 text-brownDark placeholder:text-brown/50 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
        />
      </form>

      {books.length === 0 ? (
        <p className="rounded-2xl bg-white/40 px-4 py-6 text-center text-sm text-brown">
          Your shelf is waiting 🌼
          <br />
          Add the book you&apos;re reading to begin.
        </p>
      ) : (
        <ul className="space-y-1">
          {books.map((book) => (
            <li
              key={book.id}
              className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/40"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={book.done}
                  onChange={() => toggleBook(book.id)}
                  className="h-5 w-5 flex-shrink-0 cursor-pointer accent-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
                />
                <span
                  className={
                    book.done
                      ? 'text-brown/60 line-through'
                      : 'text-brownDark'
                  }
                >
                  {book.title}
                </span>
              </label>

              <button
                type="button"
                onClick={() => deleteBook(book.id)}
                aria-label={`Remove ${book.title}`}
                // Hidden until hover/focus, but always keyboard-reachable.
                className="flex-shrink-0 rounded-full px-1.5 text-brown/60 opacity-0 transition-opacity hover:text-ever-red focus-visible:opacity-100 group-hover:opacity-100"
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
