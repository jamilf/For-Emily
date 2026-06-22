import { useMemo } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { STUDY_ROOM, PAL } from '../pixel/sprites.js'
import Toolbar from './Toolbar.jsx'

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Header({
  focusMode,
  onToggleFocus,
  onOpenFlashcards,
  onOpenGuide,
  onOpenSync,
  onOpenJournal,
  onOpenConstellations,
  onOpenQuests,
  onOpenStory,
  season,
  onOpenSeasons,
  dueCount,
}) {
  const { greeting, dateLabel } = useMemo(() => {
    const now = new Date()
    return {
      greeting: getGreeting(now.getHours()),
      dateLabel: now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    }
  }, [])

  return (
    <header className="mb-9 flex flex-col items-center gap-5 text-center text-fg sm:mb-12 sm:flex-row sm:justify-center sm:gap-8 sm:text-left">
      {/* Pixel study-room scene with a soft glow so it reads against the sky */}
      <div className="relative animate-float shrink-0">
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-3xl blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(255,210,125,0.4) 0%, transparent 70%)' }}
        />
        <PixelSprite
          grid={STUDY_ROOM}
          palette={PAL}
          pixel={6}
          className="relative drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]"
        />
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-sunset-gold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {dateLabel}
          </p>
          {season && onOpenSeasons && (
            <button
              type="button"
              onClick={onOpenSeasons}
              aria-label={`Your sanctuary is in ${season.name}. Open seasons`}
              className="rounded-full border border-cream/30 bg-bgDim/30 px-2 py-0.5 font-display text-xs text-cream drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-colors hover:bg-bgDim/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow sm:backdrop-blur-sm"
            >
              <span aria-hidden="true">{season.emoji} </span>
              {season.name}
            </button>
          )}
        </div>
        <h1 className="font-display text-4xl font-semibold text-cream drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] sm:text-[2.75rem] md:text-5xl">
          {greeting}, Emily
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-cream/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)] sm:mx-0">
          Pick one thing, start the timer, and let the rest wait. You can always come back to it.
        </p>

        <div className="mt-4">
          <Toolbar
            focusMode={focusMode}
            onToggleFocus={onToggleFocus}
            onOpenFlashcards={onOpenFlashcards}
            onOpenGuide={onOpenGuide}
            onOpenSync={onOpenSync}
            onOpenJournal={onOpenJournal}
            onOpenConstellations={onOpenConstellations}
            onOpenQuests={onOpenQuests}
            onOpenStory={onOpenStory}
            dueCount={dueCount}
          />
        </div>
      </div>
    </header>
  )
}
