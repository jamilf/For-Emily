/**
 * A compact, calm control row that lives in the header.
 * Shows the focus-mode and flashcards controls when their handlers are provided.
 * (Ambient sound now lives in the dock's Ambient Mixer, so there's no separate
 * rain toggle here — one audio source, no duplication.)
 */
export default function Toolbar({ focusMode, onToggleFocus, onOpenFlashcards, dueCount = 0 }) {
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
        <button type="button" onClick={onOpenFlashcards} className={`relative ${chip}`} aria-label="Open flashcards">
          🃏 <span className="hidden sm:inline">Flashcards</span>
          {dueCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ever-green px-1.5 text-xs text-bg0">
              {dueCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
