import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import WeekInGrove from './WeekInGrove.jsx'
import { localYMD } from '../data/focusLog.js'

// Minimal effects keeps any motion instant; seeding happens per test before render.
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
})

// Seed a realistic "this week has activity" state keyed to the real current week,
// since the component anchors to the real clock.
function seedActiveWeek() {
  localStorage.setItem(
    'emily.focusLog',
    JSON.stringify({ [localYMD(Date.now())]: { sessions: 3, minutes: 75 } }),
  )
  const nine = new Date()
  nine.setHours(9, 0, 0, 0)
  localStorage.setItem('emily.garden', JSON.stringify([{ id: 1, ts: nine.getTime() }]))
  localStorage.setItem(
    'emily.reflections',
    JSON.stringify([{ ts: Date.now(), mood: 'sun', note: 'Felt clear today' }]),
  )
}

describe('WeekInGrove (weekly reflection)', () => {
  it('renders the panel with derived gauges, the rhythm line, and a reflection', () => {
    seedActiveWeek()
    render(<WeekInGrove onClose={() => {}} />)

    expect(screen.getByRole('dialog', { name: /your week/i })).toBeInTheDocument()
    // Two positive-only gauges, exposed as meters with their value text.
    expect(screen.getAllByRole('meter')).toHaveLength(2)
    expect(screen.getByText(/3 this week, 0 last/i)).toBeInTheDocument()
    // "When you focus best" from the seeded morning session.
    expect(screen.getByText(/focus best in the morning/i)).toBeInTheDocument()
    // The reflection look-back surfaces the mood label and the note.
    expect(screen.getByText('Felt clear today')).toBeInTheDocument()
    expect(screen.getByText(/great/i)).toBeInTheDocument()
  })

  it('shows a soft invite when there are no reflections yet', () => {
    render(<WeekInGrove onClose={() => {}} />)
    expect(screen.getByText(/reflections will gather here/i)).toBeInTheDocument()
    expect(screen.getByText(/a fresh week, open and waiting/i)).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<WeekInGrove onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('has no axe-detectable accessibility violations', async () => {
    seedActiveWeek()
    const { container } = render(<WeekInGrove onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
