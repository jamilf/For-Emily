import { useEffect, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'

/**
 * Brain Dump — an always-available floating notepad. Tap the corner button to
 * open a small pad, write down whatever is pulling at your attention, and get
 * back to work. It saves itself (debounced) to emily.brainDump and is there
 * again next time. Closes on Esc or a click outside.
 */
export default function BrainDump() {
  const [saved, setSaved] = usePersistedState('emily.brainDump', '')
  const [text, setText] = useState(saved)
  const [status, setStatus] = useState('Saved')
  const [open, setOpen] = useState(false)
  const popRef = useRef(null)
  const areaRef = useRef(null)
  const timer = useRef(null)

  useEscapeKey(() => setOpen(false), open)

  useEffect(() => {
    if (open) areaRef.current?.focus()
  }, [open])

  // Close when clicking outside (but not on the toggle button).
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Debounced save, kept off the keystroke path.
  useEffect(() => {
    if (text === saved) return
    setStatus('Saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setSaved(text)
      setStatus('Saved')
    }, 400)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const hasText = text.trim().length > 0

  return (
    <div
      ref={popRef}
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-[calc(1.25rem+env(safe-area-inset-right))] z-40 font-sans"
    >
      {open && (
        <div
          role="dialog"
          aria-label="Brain dump"
          className="animate-slide-up absolute bottom-14 right-0 w-72 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border-2 border-brownDark/40 bg-cream text-brownDark shadow-window"
          style={{ animationDuration: '0.25s' }}
        >
          <div
            className="flex items-center gap-2 border-b-2 border-brownDark/40 px-3 py-2"
            style={{ background: 'linear-gradient(to bottom, #9B3D73, #7C3F76 55%, #5C3A6E)' }}
          >
            <span className="font-display text-sm text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
              Brain dump
            </span>
          </div>

          <div className="p-3">
            <label htmlFor="braindump-area" className="mb-2 block text-xs text-brown/70">
              Put whatever is pulling at you here, then get back to it later.
            </label>
            <textarea
              id="braindump-area"
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Whatever's on your mind…"
              className="w-full resize-none rounded-xl border-2 border-brown/20 bg-white/70 p-3 text-sm leading-relaxed text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
            />
            <p className="mt-1 text-right text-xs text-brown/50" aria-live="polite">
              {status}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Open your brain dump"
        className="flex h-11 items-center gap-2 rounded-full border-2 border-brownDark/40 bg-cream/90 px-3 font-display text-sm text-brown shadow-cozy sm:px-4 sm:backdrop-blur-sm transition-all hover:bg-cream active:scale-95"
      >
        <span aria-hidden="true">🧠</span>
        <span className="hidden sm:inline">Notes</span>
        {hasText && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ever-green" />}
      </button>
    </div>
  )
}
