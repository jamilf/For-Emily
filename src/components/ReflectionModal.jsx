import { useEffect, useRef } from 'react'

const MOODS = [
  { mood: 'rain', icon: '🌧️', label: 'Tough' },
  { mood: 'cloud', icon: '🌤️', label: 'Okay' },
  { mood: 'sun', icon: '☀️', label: 'Great' },
]

/**
 * End-of-session check-in, shown as a calm overlay so it never stretches the
 * timer card. Lets Emily log how the session felt, jot an optional note, and
 * tidy up (parked thoughts + the session's "one thing") in one place.
 */
export default function ReflectionModal({
  note,
  onNoteChange,
  onSaveMood,
  parkedCount = 0,
  onClearParked,
  intention = '',
  onClearIntention,
  onClose,
}) {
  const firstRef = useRef(null)

  useEffect(() => {
    firstRef.current?.focus()
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
      onTouchEnd={onClose}
    >
      <div className="absolute inset-0 bg-bgDim/75 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Session reflection"
        className="animate-modal-in relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-ever-red" />
            <span className="h-3 w-3 rounded-full bg-ever-yellow" />
            <span className="h-3 w-3 rounded-full bg-ever-green" />
          </span>
          <span className="ml-1 font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌸 Beautiful work
          </span>
        </div>

        <div className="paper-grain bg-cream p-6 text-center text-brownDark">
          <p className="font-display text-sm text-brown">How did that feel?</p>
          <div className="mt-3 flex justify-center gap-3" role="group" aria-label="Reflect on this session">
            {MOODS.map((m, i) => (
              <button
                key={m.mood}
                ref={i === 0 ? firstRef : undefined}
                onClick={() => onSaveMood(m.mood)}
                aria-label={m.label}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brown/5 text-2xl transition-all hover:bg-brown/15 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                {m.icon}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="A note, if you like…"
            className="mt-4 w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2.5 text-left text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
          />

          {(parkedCount > 0 || intention) && (
            <div className="mt-4 space-y-2 border-t border-brown/15 pt-4 text-sm">
              {parkedCount > 0 && (
                <div>
                  <p className="text-brown">
                    You parked {parkedCount} thing{parkedCount === 1 ? '' : 's'} while you focused.
                  </p>
                  <button
                    onClick={onClearParked}
                    className="mt-1 rounded-full bg-brown/10 px-4 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                  >
                    Clear the parking lot
                  </button>
                </div>
              )}
              {intention && (
                <button
                  onClick={onClearIntention}
                  className="rounded-full bg-brown/10 px-4 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                >
                  Clear “{intention.length > 24 ? intention.slice(0, 24) + '…' : intention}”
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-5 font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
