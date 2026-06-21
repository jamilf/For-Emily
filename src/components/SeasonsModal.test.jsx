import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import SeasonsModal from './SeasonsModal.jsx'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

function seedTrees(n) {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, ts: i }))),
  )
}

describe('SeasonsModal', () => {
  it('renders as an accessible dialog listing all four seasons', () => {
    render(<SeasonsModal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /sanctuary seasons/i })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    const text = items.map((li) => li.textContent).join(' ')
    for (const name of ['Spring', 'Summer', 'Autumn', 'Winter']) {
      expect(text).toContain(name)
    }
  })

  it('marks the current season in text (✦ Now) — not colour alone', () => {
    seedTrees(22) // Autumn (>= 20)
    render(<SeasonsModal onClose={() => {}} />)
    const autumn = screen.getByText('Autumn').closest('li')
    expect(autumn).toHaveTextContent(/Now/)
    const spring = screen.getByText('Spring').closest('li')
    expect(spring).not.toHaveTextContent(/Now/)
  })

  it('shows the encouraging progress-to-next line', () => {
    seedTrees(6) // Spring, 2 trees until Summer
    render(<SeasonsModal onClose={() => {}} />)
    expect(screen.getByText(/2 more trees until Summer/i)).toBeInTheDocument()
  })

  it('frames Winter as the deepest season (no next)', () => {
    seedTrees(45) // Winter
    render(<SeasonsModal onClose={() => {}} />)
    expect(screen.getByText(/deepest season/i)).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<SeasonsModal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    seedTrees(10)
    const { container } = render(<SeasonsModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
