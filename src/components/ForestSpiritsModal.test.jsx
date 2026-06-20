import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import ForestSpiritsModal from './ForestSpiritsModal.jsx'

// Seed metrics so two spirits unlock on open (Curiosity: 1 session; Persistence:
// 7-day streak) and four stay locked.
function seed() {
  localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: new Date(2026, 5, 18, 13).getTime() }]))
  localStorage.setItem('emily.stats', JSON.stringify({ streak: 7 }))
}

beforeEach(() => {
  localStorage.clear()
  seed()
})
afterEach(() => {
  localStorage.clear()
})

describe('ForestSpiritsModal', () => {
  it('renders as an accessible dialog and reconciles unlocks on open', () => {
    render(<ForestSpiritsModal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /forest spirits/i })).toBeInTheDocument()
    // Curiosity + Persistence unlocked retroactively → 2 of 6.
    expect(screen.getByText(/2 of 6 spirits/i)).toBeInTheDocument()
  })

  it('shows locked spirits with a hint + progress (state by text, not colour alone)', () => {
    render(<ForestSpiritsModal onClose={() => {}} />)
    // Dawn needs 10 before-noon sessions; we have 0 → locked with progress 0 of 10.
    expect(screen.getByRole('button', { name: /Dawn, locked,.*before noon, 0 of 10/i })).toBeInTheDocument()
  })

  it('marks freshly discovered spirits as "new!" and announces them', () => {
    render(<ForestSpiritsModal onClose={() => {}} />)
    expect(screen.getByText(/a spirit found you/i)).toBeInTheDocument()
    expect(screen.getAllByText(/new!/i).length).toBeGreaterThan(0)
  })

  it('opens a locked spirit detail with its hint and live progress', () => {
    render(<ForestSpiritsModal onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Dawn, locked/i }))
    expect(screen.getByText(/back to the spirits/i)).toBeInTheDocument()
    expect(screen.getByText(/10 focus sessions before noon/i)).toBeInTheDocument()
    expect(screen.getByText('0 / 10')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ForestSpiritsModal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('drops the idle drift under reduced motion', () => {
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
      const { container } = render(<ForestSpiritsModal onClose={() => {}} />)
      expect(container.querySelectorAll('.animate-float').length).toBe(0)
    } finally {
      window.matchMedia = prev
    }
  })

  it('animates the idle drift when motion is allowed', () => {
    const { container } = render(<ForestSpiritsModal onClose={() => {}} />)
    expect(container.querySelectorAll('.animate-float').length).toBeGreaterThan(0)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<ForestSpiritsModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
