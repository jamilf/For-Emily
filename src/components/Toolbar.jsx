import { useSync } from '../sync/SyncProvider.jsx'

/**
 * A compact control row that lives in the header. Shows the focus-mode,
 * flashcards, guide, and sync controls when their handlers are provided.
 * Ambient sound lives in the dock's mixer, so there's no separate toggle here.
 */
export default function Toolbar({
  focusMode,
  onToggleFocus,
  onOpenFlashcards,
  onOpenGuide,
  onOpenSync,
  onOpenQuests,
  dueCount = 0,
}) {
  const sync = useSync()
  // Labels stay visible at every width (icon-only circles read as mystery meat on
  // a phone); the chip just tightens a little below sm.
  const chip =
    'pill-chrome flex min-h-[44px] items-center gap-1.5 px-3 py-2 font-display text-xs text-brown shadow-sm transition-all hover:bg-cream active:scale-95 sm:gap-2 sm:px-4 sm:text-sm'

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      {/* Focus / dim mode */}
      {onToggleFocus && (
        <button
          type="button"
          onClick={onToggleFocus}
          aria-pressed={focusMode}
          className={`${chip} ${focusMode ? 'ring-2 ring-ever-yellow' : ''}`}
        >
          🎯 <span>{focusMode ? 'Focusing' : 'Focus'}</span>
        </button>
      )}

      {/* Flashcards */}
      {onOpenFlashcards && (
        <button
          type="button"
          onClick={onOpenFlashcards}
          className={`relative ${chip}`}
          aria-label="Open flashcards"
        >
          🃏 <span>Flashcards</span>
          {dueCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ever-green px-1.5 text-xs text-bg0">
              {dueCount}
            </span>
          )}
        </button>
      )}

      {/* Focus quests */}
      {onOpenQuests && (
        <button type="button" onClick={onOpenQuests} className={chip} aria-label="Open today's focus quests">
          📜 <span>Quests</span>
        </button>
      )}

      {/* Guide */}
      {onOpenGuide && (
        <button type="button" onClick={onOpenGuide} className={chip} aria-label="How to use this app">
          ❔ <span>Guide</span>
        </button>
      )}

      {/* Sync */}
      {onOpenSync && sync?.available && (
        <button
          type="button"
          onClick={onOpenSync}
          className={`relative ${chip}`}
          aria-label={sync.signedIn ? 'Sync settings, signed in' : 'Sync your progress across devices'}
        >
          ☁️ <span>{sync.signedIn ? 'Synced' : 'Sync'}</span>
          {sync.signedIn && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-ever-green"
            />
          )}
        </button>
      )}
    </div>
  )
}
