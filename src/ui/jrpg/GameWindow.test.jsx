import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import GameWindow from './GameWindow.jsx'

// Clean up any app-root nodes a test added so portal targeting stays deterministic.
afterEach(() => {
  document.querySelectorAll('.app-root').forEach((el) => el.remove())
})

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

  it('titles the window with a real h2 heading', () => {
    render(
      <GameWindow title="Grove Almanac">
        <p>trees</p>
      </GameWindow>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Grove Almanac' })).toBeInTheDocument()
  })

  it('applies the named size tiers to the modal shell (widthClass still wins as an override)', () => {
    const { rerender } = render(
      <GameWindow modal title="Letter" size="md" onClose={() => {}}>
        <p>note</p>
      </GameWindow>,
    )
    expect(document.querySelector('.animate-modal-in').className).toContain('max-w-md')
    rerender(
      <GameWindow modal title="Letter" size="md" widthClass="max-w-3xl" onClose={() => {}}>
        <p>note</p>
      </GameWindow>,
    )
    expect(document.querySelector('.animate-modal-in').className).toContain('max-w-3xl')
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

  it('portals the modal overlay into .app-root, escaping its inline location', () => {
    // In the real app the inline location can be a transformed ancestor (the
    // dashboard timer column), which would anchor a `fixed` overlay to itself. The
    // overlay must land in the app root instead so it stays true to the viewport.
    const appRoot = document.createElement('div')
    appRoot.className = 'app-root'
    document.body.appendChild(appRoot)

    const { container } = render(
      <div data-testid="inline-location">
        <GameWindow modal title="Letter" onClose={() => {}}>
          <p>note</p>
        </GameWindow>
      </div>,
    )

    const dialog = screen.getByRole('dialog', { name: /letter/i })
    expect(appRoot.contains(dialog)).toBe(true)
    // It left the inline render location entirely.
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('falls back to rendering the modal when no app root exists (still reachable)', () => {
    render(
      <GameWindow modal title="Guide" onClose={() => {}}>
        <p>help</p>
      </GameWindow>,
    )
    // With no .app-root present it portals to document.body; still in the document.
    expect(screen.getByRole('dialog', { name: /guide/i })).toBeInTheDocument()
  })

  it('has no axe-detectable violations (modal)', async () => {
    render(
      <GameWindow modal title="Settings" onClose={() => {}}>
        <p>content</p>
      </GameWindow>,
    )
    // The overlay is portaled to <body>, so scan the document rather than the
    // (now empty) render container.
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
