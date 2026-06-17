import { useEffect, useRef } from 'react'

/**
 * An accessible "desktop window" dialog showing a single quote.
 * Esc / backdrop / touch closes it; focus moves to the close button on open.
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
      <div className="absolute inset-0 bg-bgDim/75 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="A little note for you"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window animate-modal-in"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Window title bar — warm wood tone */}
        <div
          className="flex items-center gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-ever-red" />
            <span className="h-3 w-3 rounded-full bg-ever-yellow" />
            <span className="h-3 w-3 rounded-full bg-ever-green" />
          </span>
          <span className="ml-1 font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">✉ A note for you</span>
        </div>

        <div className="paper-grain bg-cream p-7 text-brownDark">
          <p className="font-sans text-base leading-relaxed sm:text-lg">{quote}</p>

          <button
            ref={closeRef}
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-brown px-4 py-3 font-display text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:bg-brownDark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
