import { useEffect, useRef } from 'react'
import useEscapeKey from '../hooks/useEscapeKey.js'
import GameWindow from '../ui/jrpg/GameWindow.jsx'

/**
 * Drawer — a non-modal slide-in panel anchored bottom-right on desktop and a
 * bottom sheet on mobile. The window chrome is the shared JRPG `GameWindow` (panel
 * variant), so the cozy 16-bit look stays consistent with every other surface.
 *
 * `open` controls visibility; the parent unmounts the drawer when closed. Closes
 * on Esc and returns focus to the opener.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 */
export default function Drawer({ open = true, onClose, title, children, className = '' }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  useEscapeKey(onClose, open)

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement
      // Focus the first control (the window's close button) for keyboard users.
      dialogRef.current?.querySelector('button')?.focus()
    } else if (openerRef.current instanceof HTMLElement) {
      openerRef.current.focus()
    }
  }, [open])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={title}
      aria-hidden={!open}
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto w-full px-3 pb-24 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:mx-0 sm:w-[22rem] sm:px-0 sm:pb-0 ${
        open
          ? 'animate-drawer-in pointer-events-auto opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      } transition-all duration-300 ${className}`}
    >
      <GameWindow
        title={title}
        onClose={onClose}
        variant="panel"
        className="shadow-window"
        bodyClassName="max-h-[65dvh] overflow-y-auto p-4 sm:max-h-none"
      >
        {children}
      </GameWindow>
    </div>
  )
}
