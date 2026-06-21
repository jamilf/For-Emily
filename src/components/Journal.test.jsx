import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import Journal from './Journal.jsx'

const ts = (y, m, d) => new Date(y, m - 1, d, 12).getTime()

function seed() {
  localStorage.setItem(
    'emily.memories',
    JSON.stringify([{ id: 1, dna: 0, ts: ts(2026, 6, 18), title: 'Passed exam', note: 'biology final' }]),
  )
  localStorage.setItem(
    'emily.spirits',
    JSON.stringify({
      unlocked: { curiosity: true, persistence: true },
      seen: {},
      discoveredAt: { curiosity: ts(2026, 5, 10), persistence: null },
    }),
  )
  localStorage.setItem('emily.focusLog', JSON.stringify({ '2026-06-18': { sessions: 2, minutes: 50 } }))
  localStorage.setItem(
    'emily.stats',
    JSON.stringify({
      day: '2026-06-18',
      minutesToday: 50,
      sessionsToday: 2,
      streak: 3,
      lastStudyDay: '2026-06-18',
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  seed()
})
afterEach(() => localStorage.clear())

describe('Journal', () => {
  it('renders as an accessible dialog with derived summary counts', () => {
    render(<Journal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /your journal/i })).toBeInTheDocument()
    const memBox = screen.getByText('Memories').closest('div')
    expect(within(memBox).getByText('1')).toBeInTheDocument()
    const spiritBox = screen.getByText('Spirits').closest('div')
    expect(within(spiritBox).getByText('2')).toBeInTheDocument()
  })

  it('groups dated entries under a month heading', () => {
    render(<Journal onClose={() => {}} />)
    expect(screen.getByText('Passed exam')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /june 2026/i })).toBeInTheDocument()
  })

  it('lists retroactively-met spirits in an undated section marked "undated"', () => {
    render(<Journal onClose={() => {}} />)
    const undatedHeading = screen.getByRole('heading', { name: /before your journal began/i })
    const section = undatedHeading.closest('section')
    expect(within(section).getByText(/persistence found you/i)).toBeInTheDocument()
    expect(within(section).getByText('undated')).toBeInTheDocument()
  })

  it('filters entries by search and updates the live count', () => {
    render(<Journal onClose={() => {}} />)
    const search = screen.getByRole('textbox', { name: /search your journal/i })
    fireEvent.change(search, { target: { value: 'exam' } })
    expect(screen.getByText('Passed exam')).toBeInTheDocument()
    fireEvent.change(search, { target: { value: 'zzzzz' } })
    expect(screen.getByText(/no entries match/i)).toBeInTheDocument()
  })

  it('shows a warm empty state when there is nothing yet', () => {
    localStorage.clear()
    render(<Journal onClose={() => {}} />)
    expect(screen.getByText(/your journal fills in as you study/i)).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<Journal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<Journal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
