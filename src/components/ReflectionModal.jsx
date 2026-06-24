import { useRef } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'

const MOODS = [
  { mood: 'rain', icon: '🌧️', label: 'Tough' },
  { mood: 'cloud', icon: '🌤️', label: 'Okay' },
  { mood: 'sun', icon: '☀️', label: 'Great' },
]

/**
 * End-of-session check-in, shown as an overlay so it never stretches the timer
 * card. Emily logs how the session felt, jots an optional note, and can clear
 * the session's "one thing".
 */
export default function ReflectionModal({
  note,
  onNoteChange,
  onSaveMood,
  intention = '',
  onClearIntention,
  reviewDue = 0,
  onReviewCards,
  onClose,
}) {
  const firstRef = useRef(null)

  return (
    <GameWindow
      modal
      title="Nice work, Emily"
      ariaLabel="Session reflection"
      onClose={onClose}
      widthClass="max-w-sm"
      bodyClassName="overflow-y-auto p-6 text-center"
    >
      <p className="font-display text-sm text-brown">How did that go?</p>
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
        placeholder="Add a note (optional)"
        className="mt-4 w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2.5 text-left text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
      />

      {reviewDue > 0 && onReviewCards && (
        <div className="mt-4 border-t border-brown/15 pt-4">
          <p className="text-xs leading-relaxed text-brown/70">
            {reviewDue} card{reviewDue === 1 ? '' : 's'} ready for a quick recall. Locking it in now, while
            your mind is warm, is when memory holds best.
          </p>
          <button
            onClick={onReviewCards}
            className="mt-2 w-full rounded-2xl bg-ever-green px-4 py-2.5 font-display text-sm text-bg0 transition-colors hover:brightness-95 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Review {reviewDue} card{reviewDue === 1 ? '' : 's'}
          </button>
        </div>
      )}

      {intention && (
        <div className="mt-4 border-t border-brown/15 pt-4 text-sm">
          <button
            onClick={onClearIntention}
            className="rounded-full bg-brown/10 px-4 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Clear “{intention.length > 24 ? intention.slice(0, 24) + '…' : intention}”
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-5 font-display text-xs text-brown/60 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        Maybe later
      </button>
    </GameWindow>
  )
}
