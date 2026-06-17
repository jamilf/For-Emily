import useSoundscape from '../audio/useSoundscape.js'

/**
 * A compact, calm control row that lives in the header.
 * Always shows the soundscape toggle; shows the focus-mode and flashcards
 * controls when their handlers are provided (wired in Phase 2).
 */
export default function Toolbar({ focusMode, onToggleFocus, onOpenFlashcards, dueCount = 0 }) {
  const { playing, toggle, volume, setVolume } = useSoundscape()

  const chip =
    'flex items-center gap-2 rounded-full border-2 border-brownDark/30 bg-cream/85 px-3 py-2 font-display text-sm text-brown shadow-sm backdrop-blur-sm transition-all hover:bg-cream active:scale-95'

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      {/* Soundscape */}
      <div className="flex items-center gap-2 rounded-full border-2 border-brownDark/30 bg-cream/85 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? 'Turn rain sound off' : 'Turn rain sound on'}
          className="flex items-center gap-1.5 font-display text-sm text-brown transition-transform active:scale-95"
        >
          🎧 <span className="hidden sm:inline">{playing ? 'Rain on' : 'Rain off'}</span>
        </button>
        {playing && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Rain sound volume"
            className="h-1.5 w-16 cursor-pointer accent-brown"
          />
        )}
      </div>

      {/* Focus / dim mode (Phase 2) */}
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

      {/* Flashcards (Phase 2) */}
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
