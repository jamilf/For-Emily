import { useMemo, useState } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { SOOT_AWAKE, PAL } from '../pixel/sprites.js'

/**
 * The soot sprite's hello. A small speech bubble near the dock that announces a
 * deterministic, context-aware greeting via aria-live WITHOUT stealing focus — so
 * it reads like the existing companion remembering her, never a popup that traps
 * her. Dismissible and keyboard-reachable; honours reduced motion.
 */
export default function SpriteGreeting({ text, onDismiss }) {
  const [open, setOpen] = useState(true)
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  if (!open || !text) return null

  function close() {
    setOpen(false)
    onDismiss?.()
  }

  return (
    <div className="zen-hide pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border-2 border-brownDark/30 bg-cream/95 px-4 py-3 text-brownDark shadow-window sm:backdrop-blur-sm ${
          reduced ? '' : 'animate-slide-up'
        }`}
      >
        <PixelSprite grid={SOOT_AWAKE} palette={PAL} pixel={3} className="shrink-0" />
        <p className="text-sm leading-snug">{text}</p>
        <button
          onClick={close}
          aria-label="Dismiss greeting"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brown/70 transition-colors hover:text-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
