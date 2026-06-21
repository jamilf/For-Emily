import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import Constellations from './Constellations.jsx'

// Seed so The First Spark + The Keepsake are formed, others partial/empty.
function seed() {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify(Array.from({ length: 4 }, (_, i) => ({ id: i, ts: new Date(2026, 5, 18, 13).getTime() }))),
  )
  localStorage.setItem(
    'emily.memories',
    JSON.stringify([
      { id: 1, dna: 0, ts: 1, title: 'a', note: '' },
      { id: 2, dna: 0, ts: 2, title: 'b', note: '' },
      { id: 3, dna: 0, ts: 3, title: 'c', note: '' },
    ]),
  )
}

beforeEach(() => {
  localStorage.clear()
  seed()
})
afterEach(() => localStorage.clear())

describe('Constellations', () => {
  it('renders as an accessible dialog with a formed-count summary', () => {
    render(<Constellations onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /your constellations/i })).toBeInTheDocument()
    expect(screen.getByText(/of 9 constellations formed/i)).toBeInTheDocument()
  })

  it('shows formed vs partial state in text, not colour alone', () => {
    render(<Constellations onClose={() => {}} />)
    // Scope to the list (the SVG also renders formed-constellation name labels).
    const items = screen.getAllByRole('listitem')
    const spark = items.find((li) => li.textContent.includes('The First Spark'))
    expect(spark).toHaveTextContent(/Formed/i)
    // The Lantern (sessions >= 10) is partial with 4 sessions.
    const lantern = items.find((li) => li.textContent.includes('The Lantern'))
    expect(lantern).toHaveTextContent(/stars lit/i)
    expect(lantern).toHaveTextContent('4 / 10')
  })

  it('keeps the decorative sky out of the accessibility tree', () => {
    const { container } = render(<Constellations onClose={() => {}} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('twinkles lit stars normally but stays static under reduced motion', () => {
    const { container, unmount } = render(<Constellations onClose={() => {}} />)
    expect(container.querySelectorAll('.animate-twinkle').length).toBeGreaterThan(0)
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
      const { container: c2 } = render(<Constellations onClose={() => {}} />)
      expect(c2.querySelectorAll('.animate-twinkle').length).toBe(0)
    } finally {
      window.matchMedia = prev
    }
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<Constellations onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<Constellations onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
