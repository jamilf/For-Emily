import { useEffect, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'

/**
 * Distraction Parking Lot — an always-available quick-capture for intrusive
 * thoughts during focus ("text mum", "did I lock the door"). A quiet floating
 * button opens a small popover with one input; entries persist to
 * emily.parkingLot so Emily can dump a thought and stay on task.
 */
export default function ParkingLot() {
  const [items, setItems] = usePersistedState('emily.parkingLot', [])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const popRef = useRef(null)

  useEscapeKey(() => setOpen(false), open)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Close when clicking outside the popover (but not the toggle button).
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function capture(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setItems((prev) => [...prev, { id: Date.now() + Math.random(), text }])
    setDraft('')
    inputRef.current?.focus()
  }

  function remove(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div ref={popRef} className="fixed bottom-5 right-5 z-40 font-sans">
      {open && (
        <div
          role="dialog"
          aria-label="Distraction parking lot"
          className="animate-slide-up absolute bottom-14 right-0 w-72 overflow-hidden rounded-2xl border-2 border-brownDark/40 bg-cream text-brownDark shadow-window"
          style={{ animationDuration: '0.25s' }}
        >
          <div
            className="flex items-center gap-2 border-b-2 border-brownDark/40 px-3 py-2"
            style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
          >
            <span className="font-display text-sm text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
              ✏️ Park a thought
            </span>
          </div>

          <div className="p-3">
            <form onSubmit={capture} className="flex gap-2">
              <label htmlFor="park-input" className="sr-only">
                Capture a distracting thought
              </label>
              <input
                id="park-input"
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type it, let it go…"
                className="min-w-0 flex-1 rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <button
                type="submit"
                aria-label="Save thought"
                className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-brown/15 font-display text-xl text-brown transition-colors hover:bg-brown/30 active:scale-95"
              >
                +
              </button>
            </form>

            {items.length > 0 && (
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto pr-1 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="group/park flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/60">
                    <span className="flex-1 break-words text-brownDark/90">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove "${item.text}"`}
                      className="flex-shrink-0 rounded-full px-1 text-brown/60 transition-colors hover:text-ever-red active:scale-90"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-center text-xs text-brown/60">
              {items.length === 0
                ? 'Nothing parked — your focus is clear 🌿'
                : 'Come back to these after you focus.'}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Open the distraction parking lot"
        className="flex items-center gap-2 rounded-full border-2 border-brownDark/40 bg-cream/90 px-4 py-2.5 font-display text-sm text-brown shadow-cozy backdrop-blur-sm transition-all hover:bg-cream active:scale-95"
      >
        ✏️ Capture
        {items.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brown px-1.5 text-xs text-cream">
            {items.length}
          </span>
        )}
      </button>
    </div>
  )
}
