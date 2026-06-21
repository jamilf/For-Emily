/**
 * Dock — a calm control rail (bottom-centre) that toggles the optional feature
 * drawers and Zen Mode. Everything stays behind these buttons by default so the
 * core dashboard reads as uncluttered (progressive disclosure for ADHD).
 */
export default function Dock({
  openDrawer,
  onToggle,
  zen,
  onToggleZen,
  mixerEnabled,
  onOpenFlashcards,
  flashcardsDue = 0,
}) {
  const items = [{ id: 'mixer', icon: '🎚️', label: 'Ambient mixer' }]

  const base =
    'relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-lg transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow'

  return (
    <div
      aria-label="Tools"
      role="toolbar"
      className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-fit items-center gap-2 rounded-full border-2 border-brownDark/30 bg-cream/85 px-2.5 py-2 shadow-window sm:backdrop-blur-sm"
    >
      {items.map((it) => {
        const active = openDrawer === it.id
        return (
          <button
            key={it.id}
            onClick={() => onToggle(it.id)}
            aria-label={it.label}
            title={it.label}
            aria-expanded={active}
            className={`${base} ${
              active ? 'border-sunset-magenta bg-sunset-pink/40' : 'border-brownDark/20 bg-cream'
            }`}
          >
            <span aria-hidden="true">{it.icon}</span>
            {it.id === 'mixer' && mixerEnabled && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-ever-green"
              />
            )}
          </button>
        )
      })}

      {onOpenFlashcards && (
        <button
          onClick={onOpenFlashcards}
          aria-label={flashcardsDue > 0 ? `Flashcards, ${flashcardsDue} due` : 'Flashcards'}
          title="Flashcards"
          className={`${base} border-brownDark/20 bg-cream`}
        >
          <span aria-hidden="true">🃏</span>
          {flashcardsDue > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-sunset-magenta"
            />
          )}
        </button>
      )}

      <span className="mx-0.5 h-6 w-px bg-brownDark/20" aria-hidden="true" />

      <button
        onClick={onToggleZen}
        aria-label="Zen mode"
        title="Zen mode"
        aria-pressed={zen}
        className={`${base} ${zen ? 'border-sunset-magenta bg-sunset-plum text-cream' : 'border-brownDark/20 bg-cream'}`}
      >
        <span aria-hidden="true">🌙</span>
      </button>
    </div>
  )
}
