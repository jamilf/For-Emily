import { useMemo, useState } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { SOOT_AWAKE, PAL } from '../pixel/sprites.js'

/**
 * The soot sprite's hello. A small speech bubble near the dock that announces a
 * deterministic, context-aware greeting via aria-live WITHOUT stealing focus — so
 * it reads like the existing companion remembering her, never a popup that traps
 * her. While the sprite is unnamed it gently offers to let her name it (optional,
 * dismissible). Dismissible and keyboard-reachable; honours reduced motion.
 */
export default function SpriteGreeting({ text, companionName = null, onName, onDismiss }) {
  const [open, setOpen] = useState(true)
  const [naming, setNaming] = useState(false)
  const [draft, setDraft] = useState('')
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

  function save(e) {
    e.preventDefault()
    if (draft.trim()) onName?.(draft)
    setNaming(false)
    setDraft('')
  }

  const canName = !companionName && typeof onName === 'function'

  return (
    <div className="zen-hide pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-sm rounded-2xl border-2 border-brownDark/30 bg-cream/95 px-4 py-3 text-brownDark shadow-window sm:backdrop-blur-sm ${
          reduced ? '' : 'animate-slide-up'
        }`}
      >
        <div className="flex items-center gap-3">
          <PixelSprite grid={SOOT_AWAKE} palette={PAL} pixel={3} className="shrink-0" />
          <p className="flex-1 text-sm leading-snug">{text}</p>
          <button
            onClick={close}
            aria-label="Dismiss greeting"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brown/70 transition-colors hover:text-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        {canName && !naming && (
          <button
            onClick={() => setNaming(true)}
            className="mt-1 pl-12 text-left text-xs text-brown/60 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ps. you can give me a name 🤍
          </button>
        )}

        {canName && naming && (
          <form onSubmit={save} className="mt-2 flex items-center gap-2 pl-12">
            <label htmlFor="companion-name" className="sr-only">
              What should you call the sprite?
            </label>
            <input
              id="companion-name"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={24}
              placeholder="what should you call me?"
              className="min-w-0 flex-1 rounded-xl border-2 border-brown/20 bg-white/80 px-2.5 py-1.5 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="shrink-0 rounded-xl bg-brown px-3 py-1.5 font-display text-xs text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-50"
            >
              save
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
