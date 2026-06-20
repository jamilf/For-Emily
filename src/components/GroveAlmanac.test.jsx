import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import GroveAlmanac from './GroveAlmanac.jsx'
import { SPECIES, dnaOf } from '../data/grove.js'

// A garden of N trees, all grown this afternoon (so before-noon/after-dark stay off).
function seedGarden(n) {
  const d = new Date()
  d.setHours(14, 0, 0, 0)
  const garden = Array.from({ length: n }, (_, i) => ({ id: i, ts: d.getTime() }))
  localStorage.setItem('emily.garden', JSON.stringify(garden))
}

beforeEach(() => localStorage.clear())

describe('GroveAlmanac', () => {
  it('renders an accessible dialog with a progress header', () => {
    seedGarden(2)
    render(<GroveAlmanac onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /grove almanac/i })).toBeInTheDocument()
    expect(screen.getByText(/you've grown \d+ of \d+/i)).toBeInTheDocument()
  })

  it('shows unlocked varietals and locked silhouettes with hints + progress', () => {
    seedGarden(2) // unlocks first-sprout (1) and quiet-pine (2)
    render(<GroveAlmanac onClose={() => {}} />)
    // Unlocked card by name.
    expect(screen.getByRole('button', { name: /First Sprout, grown/i })).toBeInTheDocument()
    // A locked card exposes its hint + progress in the accessible name.
    expect(screen.getByRole('button', { name: /Sunfacer Oak, locked, .*2 of 6/i })).toBeInTheDocument()
  })

  it('filters to locked only', () => {
    seedGarden(2)
    render(<GroveAlmanac onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'locked' }))
    expect(screen.queryByRole('button', { name: /First Sprout, grown/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sunfacer Oak, locked/i })).toBeInTheDocument()
  })

  it('opens a detail view and queues "grow this one next" for an unlocked varietal', () => {
    seedGarden(2)
    render(<GroveAlmanac onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /First Sprout, grown/i }))
    fireEvent.click(screen.getByRole('button', { name: /grow this one next/i }))
    expect(screen.getByText(/your next session grows this/i)).toBeInTheDocument()
    const grove = JSON.parse(localStorage.getItem('emily.grove'))
    expect(grove.plantNext).toBe(dnaOf(SPECIES.find((s) => s.id === 'first-sprout')))
  })

  it('closes on Escape', () => {
    seedGarden(1)
    const onClose = vi.fn()
    render(<GroveAlmanac onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('has no axe violations', async () => {
    seedGarden(3)
    const { container } = render(<GroveAlmanac onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
