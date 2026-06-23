import { useMemo, useState } from 'react'

/**
 * A gentle "you have a letter" reveal. The sprite leaves Emily a short letter when
 * she crosses a real, cumulative milestone. Announces via aria-live without stealing
 * focus (a toast, not a trap), offers to open the Story to read it, and acknowledges
 * on dismiss so it never re-shows. Honours reduced motion. A small gift, never a task.
 */
export default function LetterReveal({ letter, companionName = null, onRead, onAck }) {
  const [open, setOpen] = useState(true)
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  if (!open || !letter) return null

  const from = companionName || 'your soot friend'

  function ack() {
    setOpen(false)
    onAck?.(letter.id)
  }
  function read() {
    onRead?.()
    ack()
  }

  return (
    <div className="zen-hide pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-sm rounded-2xl border-2 border-brownDark/30 bg-cream/95 p-4 text-brownDark shadow-window sm:backdrop-blur-sm ${
          reduced ? '' : 'animate-slide-up'
        }`}
      >
        <p className="font-display text-xs uppercase tracking-wide text-brown/55">A letter from {from}</p>
        <p className="mt-0.5 font-display text-lg text-brown">{letter.title}</p>
        <p className="mt-1 text-sm leading-snug text-brownDark/85">{letter.lines[0]}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={read}
            className="rounded-xl bg-brown px-4 py-2 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Read it
          </button>
          <button
            onClick={ack}
            className="rounded-xl px-3 py-2 font-display text-sm text-brown/70 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
