import { useMemo } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { STUDY_ROOM, PAL } from '../pixel/sprites.js'

function getGreeting(hour) {
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Header() {
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
      {/* Pixel study-room scene */}
      <div className="animate-float shrink-0">
        <PixelSprite grid={STUDY_ROOM} palette={PAL} pixel={6} className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]" />
      </div>

      <div>
        <p className="mb-2 font-display text-sm uppercase tracking-[0.25em] text-ever-yellow">
          {dateLabel}
        </p>
        <h1 className="font-display text-4xl font-semibold text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-5xl">
          {greeting}, Emily <span aria-hidden="true">🌿</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-fg/80 sm:mx-0">
          Your cozy corner to think, rest, and grow. There&apos;s no rush here —
          just take the next small step.
        </p>
      </div>
    </header>
  )
}
