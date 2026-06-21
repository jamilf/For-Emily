import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import QuestBoard from './QuestBoard.jsx'

// A timestamp at hour `h` of TODAY (local), regardless of when the test runs.
function todayAt(h) {
  const d = new Date()
  d.setHours(h, 0, 0, 0)
  return d.getTime()
}

// Seed enough of every metric that whichever 3 quests today's date picks are all met.
function seedAllDone() {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify([
      { id: 0, ts: todayAt(9) }, // before noon
      { id: 1, ts: todayAt(13) },
      { id: 2, ts: todayAt(21) }, // after dark
    ]),
  )
  const utcToday = new Date().toISOString().slice(0, 10)
  localStorage.setItem('emily.flashcardStats', JSON.stringify({ day: utcToday, reviewedToday: 25 }))
  localStorage.setItem('emily.reflections', JSON.stringify([{ ts: todayAt(10), mood: 'sun', note: 'good' }]))
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('QuestBoard', () => {
  it('renders today’s quests with a gentle, no-fail framing', () => {
    render(<QuestBoard onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /focus quests/i })).toBeInTheDocument()
    expect(screen.getByText(/0 of 3 quests tended today/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing to fail here and no streak to break/i)).toBeInTheDocument()
    // Never any failed / expired status wording (the gentle "nothing to fail" copy
    // is fine; what we forbid is a fail/expire state).
    expect(screen.queryByText(/failed/i)).toBeNull()
    expect(screen.queryByText(/expired/i)).toBeNull()
  })

  it('lists three quests and shows progress / not-yet state in text', () => {
    render(<QuestBoard onClose={() => {}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    // With nothing done, no completion celebration.
    expect(screen.queryByText(/all tended today/i)).toBeNull()
  })

  it('celebrates (cosmetically) when every quest is done', () => {
    seedAllDone()
    const { container } = render(<QuestBoard onClose={() => {}} />)
    expect(screen.getByText(/3 of 3 quests tended today/i)).toBeInTheDocument()
    expect(screen.getByText(/all tended today/i)).toBeInTheDocument()
    expect(screen.getAllByText('✓ Done')).toHaveLength(3)
    expect(container.querySelector('.animate-pixel-pop')).toBeTruthy()
  })

  it('drops the celebration animation under reduced motion', () => {
    seedAllDone()
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
      const { container } = render(<QuestBoard onClose={() => {}} />)
      expect(screen.getByText(/all tended today/i)).toBeInTheDocument() // still celebrates
      expect(container.querySelector('.animate-pixel-pop')).toBeNull() // just no motion
    } finally {
      window.matchMedia = prev
    }
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<QuestBoard onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks background scroll while open and restores it on close', () => {
    expect(document.body.style.position).toBe('')
    const { unmount } = render(<QuestBoard onClose={() => {}} />)
    expect(document.body.style.position).toBe('fixed') // body pinned via useFocusTrap
    unmount()
    expect(document.body.style.position).toBe('')
  })

  it('has no axe-detectable accessibility violations', async () => {
    seedAllDone()
    const { container } = render(<QuestBoard onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
