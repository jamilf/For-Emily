import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import GameWindow from './GameWindow.jsx'

describe('GameWindow', () => {
  it('renders an inline titled panel (no dialog role) by default', () => {
    render(
      <GameWindow title="Sound & Music">
        <p>body</p>
      </GameWindow>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Sound & Music')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('as a modal exposes role=dialog with the title as its accessible name', () => {
    render(
      <GameWindow modal title="Flashcards" onClose={() => {}}>
        <p>cards</p>
      </GameWindow>,
    )
    expect(screen.getByRole('dialog', { name: /flashcards/i })).toBeInTheDocument()
  })

  it('renders a labeled close button that fires onClose', () => {
    const onClose = vi.fn()
    render(
      <GameWindow modal title="Journal" onClose={onClose}>
        x
      </GameWindow>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close journal/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on the overlay click', () => {
    const onClose = vi.fn()
    render(
      <GameWindow modal title="Quests" onClose={onClose}>
        x
      </GameWindow>,
    )
    // The overlay is the aria-hidden full-bleed button behind the window.
    const overlay = document.querySelector('.fixed.inset-0 > button[aria-hidden="true"]')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalled()
  })

  it('has no axe-detectable violations (modal)', async () => {
    const { container } = render(
      <GameWindow modal title="Settings" onClose={() => {}}>
        <p>content</p>
      </GameWindow>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
