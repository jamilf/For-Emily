import { useState } from 'react'
import DialogueBox from '../ui/jrpg/DialogueBox.jsx'

/**
 * The soot sprite's hello, framed as a JRPG dialogue window. A small message box
 * near the dock announces a deterministic, context-aware greeting via aria-live
 * WITHOUT stealing focus — so it reads like the companion remembering her, never a
 * popup that traps her. While the sprite is unnamed it gently offers to let her
 * name it (optional, dismissible). Built on the shared DialogueBox (portrait +
 * nameplate + skippable typewriter); dismissible and keyboard-reachable; honours
 * reduced motion (instant text).
 */
export default function SpriteGreeting({ text, companionName = null, onName, onDismiss }) {
  const [open, setOpen] = useState(true)
  const [naming, setNaming] = useState(false)
  const [draft, setDraft] = useState('')

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
      <div role="status" aria-live="polite" className="pointer-events-auto relative w-full max-w-sm">
        <DialogueBox name={companionName || 'your soot friend'} text={text} live={false} className="pr-9">
          {canName && !naming && (
            <button
              onClick={() => setNaming(true)}
              className="text-left text-xs text-jrpg-text/70 underline-offset-2 transition-colors hover:text-jrpg-text hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
            >
              ps. you can give me a name 🤍
            </button>
          )}

          {canName && naming && (
            <form onSubmit={save} className="flex items-center gap-2">
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
                className="min-w-0 flex-1 rounded-md border-2 border-jrpg-edge bg-cream/95 px-2.5 py-1.5 text-sm text-brownDark placeholder:text-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="shrink-0 rounded-md bg-brown px-3 py-1.5 font-display text-xs text-cream transition-colors hover:bg-brownDark active:scale-95 disabled:opacity-50"
              >
                save
              </button>
            </form>
          )}
        </DialogueBox>

        <button
          onClick={close}
          aria-label="Dismiss greeting"
          className="absolute right-1.5 top-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-md text-jrpg-text/80 transition-colors hover:text-jrpg-text focus-visible:ring-2 focus-visible:ring-ever-yellow"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
