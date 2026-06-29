import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import CompanionMenu from './CompanionMenu.jsx'

// Minimal effects → the dialogue typewriter is instant (deterministic in jsdom).
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    'emily.ui',
    JSON.stringify({ effects: 'minimal', typewriter: true, sounds: 0, onboarded: true }),
  )
})

function setup(over = {}) {
  const props = {
    companionName: 'Pip',
    dueCount: 0,
    hasMail: false,
    running: false,
    onReadLetter: vi.fn(),
    onStartFocus: vi.fn(),
    onReviewCards: vi.fn(),
    onOpenGrove: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  render(<CompanionMenu {...props} />)
  return props
}

describe('CompanionMenu (overworld NPC)', () => {
  it('opens as a dialog named for the companion, with a line and base actions', () => {
    setup()
    expect(screen.getByRole('dialog', { name: /talk to pip/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start a focus session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /wander the grove/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /never mind/i })).toBeInTheDocument()
  })

  it('shows Read-your-letter only when there is mail', () => {
    const { rerender } = render(<CompanionMenu onClose={() => {}} hasMail={false} />)
    expect(screen.queryByRole('button', { name: /read your letter/i })).not.toBeInTheDocument()
    rerender(<CompanionMenu onClose={() => {}} hasMail onReadLetter={() => {}} />)
    expect(screen.getByRole('button', { name: /read your letter/i })).toBeInTheDocument()
  })

  it('shows Review only when cards are due, with the count', () => {
    setup({ dueCount: 3 })
    expect(screen.getByRole('button', { name: /review 3 cards/i })).toBeInTheDocument()
  })

  it('hides Start a focus session while a session is already running', () => {
    setup({ running: true })
    expect(screen.queryByRole('button', { name: /start a focus session/i })).not.toBeInTheDocument()
  })

  it('an action fires its callback and then closes', () => {
    const { onOpenGrove, onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: /wander the grove/i }))
    expect(onOpenGrove).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape closes the panel', () => {
    const { onClose } = setup()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(
      <CompanionMenu companionName="Pip" dueCount={2} hasMail onClose={() => {}} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
