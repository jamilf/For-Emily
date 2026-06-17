import { useEffect, useRef } from 'react'
import useEscapeKey from '../hooks/useEscapeKey.js'

/**
 * Drawer — a calm, non-modal slide-in panel anchored bottom-right on desktop and
 * a bottom sheet on mobile. Wraps content in the app's window chrome.
 *
 * `open` controls visibility. Media drawers (Study Partner, Spotify) stay mounted
 * and just hide (so playback continues); lightweight drawers are unmounted by the
 * parent when closed. Closes on Esc and returns focus to the opener.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 */
export default function Drawer({ open = true, onClose, title, children, className = '' }) {
  const closeRef = useRef(null)
  const openerRef = useRef(null)

  useEscapeKey(onClose, open)

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement
      closeRef.current?.focus()
    } else if (openerRef.current instanceof HTMLElement) {
      openerRef.current.focus()
    }
  }, [open])

  return (
    <div
      role="dialog"
      aria-label={title}
      aria-hidden={!open}
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full px-3 pb-24 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:mx-0 sm:w-[22rem] sm:px-0 sm:pb-0 ${
        open
          ? 'animate-drawer-in pointer-events-auto opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      } transition-all duration-300 ${className}`}
    >
      <div className="overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window">
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9B3D73, #7C3F76 55%, #5C3A6E)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            {title}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-full px-2 text-cream/90 transition-colors hover:text-cream active:scale-90"
          >
            ✕
          </button>
        </div>
        <div className="paper-grain relative max-h-[60vh] overflow-y-auto bg-cream p-4 text-brownDark sm:max-h-none">
          {children}
        </div>
      </div>
    </div>
  )
}
