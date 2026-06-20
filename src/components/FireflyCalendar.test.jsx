import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import FireflyCalendar from './FireflyCalendar.jsx'
import { lastNWeeks, localYMD } from '../data/focusLog.js'

const DAY = 24 * 60 * 60 * 1000
const WEEKS = 16

// Seed a log relative to the real "today" so the cells land inside the window
// no matter when the suite runs.
function seed() {
  const now = Date.now()
  const ymdToday = localYMD(now)
  const ymdPast = localYMD(now - 3 * DAY)
  localStorage.setItem(
    'emily.focusLog',
    JSON.stringify({
      [ymdPast]: { sessions: 3, minutes: 75 },
      [ymdToday]: { sessions: 1, minutes: 25 },
    }),
  )
  localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: now - 3 * DAY }]))
  localStorage.setItem(
    'emily.stats',
    JSON.stringify({ day: ymdToday, minutesToday: 25, sessionsToday: 1, streak: 5, lastStudyDay: ymdToday }),
  )
  return { ymdToday, ymdPast }
}

beforeEach(() => {
  localStorage.clear()
  seed()
})

describe('FireflyCalendar', () => {
  it('renders as an accessible dialog with a reused streak in the summary', () => {
    render(<FireflyCalendar onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /firefly calendar/i })).toBeInTheDocument()
    // Streak comes straight from emily.stats (reused, not recomputed).
    const streakBox = screen.getByText('Day streak').closest('div')
    expect(within(streakBox).getByText('5')).toBeInTheDocument()
  })

  it('renders one button per non-future day with friendly accessible labels', () => {
    render(<FireflyCalendar onClose={() => {}} />)
    const group = screen.getByRole('group', { name: /focus meadow/i })
    const expected = lastNWeeks({}, new Date(), WEEKS)
      .flat()
      .filter((c) => !c.inFuture).length
    expect(within(group).getAllByRole('button')).toHaveLength(expected)
    // The seeded busy day reads its count (and known minutes), never shame.
    expect(within(group).getByRole('button', { name: /3 focus sessions, ~75 min/i })).toBeInTheDocument()
    expect(within(group).getAllByRole('button', { name: /no sessions yet/i }).length).toBeGreaterThan(0)
  })

  it('moves focus with arrow keys via roving tabindex', () => {
    const { container } = render(<FireflyCalendar onClose={() => {}} />)
    const start = container.querySelector('button[tabindex="0"]')
    expect(start).toBeTruthy()
    fireEvent.keyDown(start, { key: 'ArrowLeft' })
    const next = container.querySelector('button[tabindex="0"]')
    expect(next).not.toBe(start)
    expect(next).toBe(document.activeElement)
  })

  it('selects a day with click and updates the aria-live detail region', () => {
    render(<FireflyCalendar onClose={() => {}} />)
    const group = screen.getByRole('group', { name: /focus meadow/i })
    const busy = within(group).getByRole('button', { name: /3 focus sessions/i })
    fireEvent.click(busy)
    expect(screen.getByText(/3 fireflies lit/i)).toBeInTheDocument()
  })

  it('twinkles fireflies normally but stays static under reduced motion', () => {
    const { container, unmount } = render(<FireflyCalendar onClose={() => {}} />)
    // Default stub reports no preference → fireflies twinkle.
    expect(container.querySelectorAll('span.bg-ever-yellow.animate-twinkle').length).toBeGreaterThan(0)
    unmount()

    const prev = window.matchMedia
    window.matchMedia = (q) => ({
      matches: true,
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })
    try {
      const { container: c2 } = render(<FireflyCalendar onClose={() => {}} />)
      const dots = c2.querySelectorAll('span.bg-ever-yellow')
      expect(dots.length).toBeGreaterThan(0)
      dots.forEach((d) => expect(d.classList.contains('animate-twinkle')).toBe(false))
    } finally {
      window.matchMedia = prev
    }
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<FireflyCalendar onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<FireflyCalendar onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

afterEach(() => {
  localStorage.clear()
})
