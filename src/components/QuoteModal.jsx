import { useEffect, useRef } from 'react'

/**
 * A small, accessible modal that shows a single quote.
 * - Esc closes it, clicking the backdrop closes it.
 * - Focus moves to the close button on open for keyboard users.
 */
export default function QuoteModal({ quote, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    // Move focus into the dialog and listen for Esc.
    closeRef.current?.focus()

    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onMouseDown={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-forest/70 backdrop-blur-sm" />

      {/* Card — stopPropagation so clicks inside don't close it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="A little note for you"
        className="relative z-10 w-full max-w-md rounded-3xl bg-cream p-7 text-brownDark shadow-cozy animate-modal-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brown">
          <span aria-hidden="true">✉️</span>
          <span>A little note for you, Emily</span>
        </div>

        <p className="font-serif text-lg leading-relaxed">{quote}</p>

        <button
          ref={closeRef}
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-brown px-4 py-2.5 font-medium text-cream transition-colors hover:bg-brownDark focus-visible:bg-brownDark"
        >
          Close
        </button>
      </div>
    </div>
  )
}
