import { useMemo } from 'react'

/** Pick a greeting based on the local hour. */
function getGreeting(hour) {
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default function Header() {
  // Computed once on render — the greeting reflects when she opens the app.
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
    <header className="mb-8 text-center text-cream sm:mb-10">
      <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-ever-yellow">
        {dateLabel}
      </p>

      <h1 className="animate-float font-serif text-4xl font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-5xl">
        {greeting}, Emily <span aria-hidden="true">🌿</span>
      </h1>

      <p className="mx-auto mt-3 max-w-md text-pretty text-cream/80">
        Your cozy corner to think, rest, and grow. There&apos;s no rush here —
        just take the next small step.
      </p>
    </header>
  )
}
