import { useEffect, useRef } from 'react'

/**
 * An accessible modal that shows a single quote.
 * - Esc closes it; clicking or touching the backdrop closes it.
 * - Focus moves to the close button on open for keyboard users.
 */
export default function QuoteModal({ quote, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
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
      onTouchEnd={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-forest/75 backdrop-blur-sm" />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="A little note for you"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-cozy animate-modal-in"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Accent top border */}
        <div className="h-1 w-full bg-gradient-to-r from-ever-yellow via-ever-aqua to-ever-green" />

        <div className="p-7 text-brownDark">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brown">
            <span aria-hidden="true">✉️</span>
            <span>A little note for you, Emily</span>
          </div>

          <p className="font-serif text-base leading-relaxed sm:text-lg">{quote}</p>

          <button
            ref={closeRef}
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-brown px-4 py-3 font-medium text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:bg-brownDark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
