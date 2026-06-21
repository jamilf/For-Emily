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
  onOpenJournal,
  onOpenConstellations,
  dueCount = 0,
}) {
  const sync = useSync()
  const chip =
    'flex items-center gap-2 rounded-full border-2 border-brownDark/30 bg-cream/85 px-4 py-2 font-display text-sm text-brown shadow-sm sm:backdrop-blur-sm transition-all hover:bg-cream active:scale-95'

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
          🎯 <span className="hidden sm:inline">{focusMode ? 'Focusing' : 'Focus'}</span>
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
          🃏 <span className="hidden sm:inline">Flashcards</span>
          {dueCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ever-green px-1.5 text-xs text-bg0">
              {dueCount}
            </span>
          )}
        </button>
      )}

      {/* Journal */}
      {onOpenJournal && (
        <button type="button" onClick={onOpenJournal} className={chip} aria-label="Open your journal">
          📔 <span className="hidden sm:inline">Journal</span>
        </button>
      )}

      {/* Constellations */}
      {onOpenConstellations && (
        <button
          type="button"
          onClick={onOpenConstellations}
          className={chip}
          aria-label="Open your constellations"
        >
          🌌 <span className="hidden sm:inline">Constellations</span>
        </button>
      )}

      {/* Guide */}
      {onOpenGuide && (
        <button type="button" onClick={onOpenGuide} className={chip} aria-label="How to use this app">
          ❔ <span className="hidden sm:inline">Guide</span>
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
          ☁️ <span className="hidden sm:inline">{sync.signedIn ? 'Synced' : 'Sync'}</span>
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
