import { useEffect, useRef, useState } from 'react'
import WindowFrame from './WindowFrame.jsx'

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
 * Widget 1 — The Book Nook (lofi window).
 * Notebook-paper "Current Reads" list. Enter or the ＋ button adds; persists to
 * localStorage. Delete ✕ is always visible on touch, hover-revealed on desktop.
 */
export default function BookNook() {
  const [books, setBooks] = useState(loadBooks)
  const [draft, setDraft] = useState('')
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
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, done: !b.done } : b)))
  }

  function deleteBook(id) {
    setBooks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <WindowFrame title="Book Nook" bodyClass="bg-cream">
      {/* Notebook ruled-line area */}
      <div
        className="relative -mx-1 rounded-xl px-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 31px, rgba(143,94,54,0.13) 31px, rgba(143,94,54,0.13) 32px)',
        }}
      >
        <p className="mb-3 font-display text-lg text-brown">📖 Current reads</p>

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
            className="min-w-0 flex-1 rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2.5 text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
          />
          <button
            type="submit"
            aria-label="Add book"
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-brown/15 font-display text-2xl text-brown transition-colors hover:bg-brown/30 active:scale-95"
          >
            +
          </button>
        </form>

        {books.length === 0 ? (
          <p className="rounded-xl bg-white/50 px-4 py-6 text-center text-sm text-brown">
            Your shelf is waiting 🌼
            <br />
            Add the book you&apos;re reading to begin.
          </p>
        ) : (
          <ul className="space-y-1 pb-1">
            {books.map((book) => (
              <li
                key={book.id}
                className={`group/item flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/60 ${
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

                <button
                  type="button"
                  onClick={() => deleteBook(book.id)}
                  aria-label={`Remove ${book.title}`}
                  className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded-full text-brown/60 transition-all duration-150 hover:text-ever-red active:scale-90 sm:opacity-0 sm:group-hover/item:opacity-100 sm:focus-visible:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WindowFrame>
  )
}
