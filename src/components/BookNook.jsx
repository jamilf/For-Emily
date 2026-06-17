import { useRef, useState } from 'react'
import WindowFrame from './WindowFrame.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'

const MAX_TODAY = 3 // the cap is the feature — it prevents overwhelm

/**
 * Widget 1 — The Book Nook (lofi window).
 * Two tabs: "Reads" (the persistent reading list) and "Today" (a 3-item
 * micro-task list, hard-capped to keep the day's plan calm). Enter or the ＋
 * button adds; both lists persist to localStorage under emily.*.
 */
export default function BookNook() {
  const [tab, setTab] = useState('reads')
  const [books, setBooks] = usePersistedState('emily.books', [])
  const [today, setToday] = usePersistedState('emily.today', [])
  const [draft, setDraft] = useState('')
  const [newestId, setNewestId] = useState(null)
  const inputRef = useRef(null)

  const isToday = tab === 'today'
  const items = isToday ? today : books
  const setItems = isToday ? setToday : setBooks
  const atCap = isToday && today.length >= MAX_TODAY

  function addItem(e) {
    e.preventDefault()
    const title = draft.trim()
    if (!title || atCap) return
    const id = Date.now() + Math.random()
    setNewestId(id)
    setItems((prev) => [...prev, { id, title, done: false }])
    setDraft('')
    inputRef.current?.focus()
  }

  function toggleItem(id) {
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, done: !b.done } : b)))
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((b) => b.id !== id))
  }

  const tabClass = (active) =>
    `rounded-full px-5 py-1.5 transition-all duration-200 ${
      active ? 'scale-[1.04] bg-brown text-cream shadow-sm' : 'text-brown hover:bg-brown/10'
    }`

  return (
    <WindowFrame title="Book Nook" bodyClass="bg-cream">
      {/* Reads | Today tabs */}
      <div role="tablist" aria-label="Book Nook lists" className="mb-4 flex gap-1 rounded-full bg-brown/10 p-1 font-display text-sm">
        <button role="tab" aria-selected={!isToday} onClick={() => setTab('reads')} className={tabClass(!isToday)}>
          Reads
        </button>
        <button role="tab" aria-selected={isToday} onClick={() => setTab('today')} className={tabClass(isToday)}>
          Today
        </button>
      </div>

      {/* Notebook ruled-line area */}
      <div
        className="relative -mx-1 rounded-xl px-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 31px, rgba(143,94,54,0.13) 31px, rgba(143,94,54,0.13) 32px)',
        }}
      >
        <p className="mb-3 font-display text-lg text-brown">
          {isToday ? "🌿 Today's 3" : '📖 Current reads'}
        </p>

        <form onSubmit={addItem} className="mb-4 flex gap-2">
          <label htmlFor="book-input" className="sr-only">
            {isToday ? 'Add a task for today' : 'Add a book title'}
          </label>
          <input
            id="book-input"
            ref={inputRef}
            type="text"
            inputMode="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={atCap}
            placeholder={atCap ? 'Three is plenty for today 🌿' : isToday ? 'One small task…' : 'Add a title…'}
            className="min-w-0 flex-1 rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2.5 text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={atCap}
            aria-label={isToday ? 'Add task' : 'Add book'}
            className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-brown/15 font-display text-2xl text-brown transition-colors hover:bg-brown/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </form>

        {items.length === 0 ? (
          <p className="rounded-xl bg-white/50 px-4 py-6 text-center text-sm text-brown">
            {isToday ? (
              <>
                Pick up to three small things for today 🌱
                <br />
                Little steps count.
              </>
            ) : (
              <>
                Your shelf is waiting 🌼
                <br />
                Add the book you&apos;re reading to begin.
              </>
            )}
          </p>
        ) : (
          <ul className="space-y-1 pb-1">
            {items.map((item) => (
              <li
                key={item.id}
                className={`group/item flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/60 ${
                  item.id === newestId ? 'animate-slide-up' : ''
                }`}
                style={item.id === newestId ? { animationDuration: '0.3s' } : {}}
              >
                <label className="flex min-h-[32px] flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="h-5 w-5 flex-shrink-0 cursor-pointer rounded accent-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
                  />
                  <span
                    className={`transition-all duration-200 ${
                      item.done ? 'text-brown/55 line-through' : 'text-brownDark'
                    }`}
                  >
                    {item.title}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  aria-label={`Remove ${item.title}`}
                  className="min-h-[36px] min-w-[36px] flex-shrink-0 rounded-full text-brown/60 transition-all duration-150 hover:text-ever-red active:scale-90 sm:opacity-0 sm:group-hover/item:opacity-100 sm:focus-visible:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {isToday && atCap && (
          <p className="pb-1 text-center text-xs text-brown/60">Three is plenty for today 🌿</p>
        )}
      </div>
    </WindowFrame>
  )
}
