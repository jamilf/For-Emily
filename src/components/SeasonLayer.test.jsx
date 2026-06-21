import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import SeasonLayer from './SeasonLayer.jsx'
import { SEASONS_BY_ID } from '../data/seasons.js'

const autumn = SEASONS_BY_ID.autumn

afterEach(() => {
  // Restore any matchMedia override.
})

describe('SeasonLayer', () => {
  it('is decorative — aria-hidden and non-interactive, sitting behind content', () => {
    const { container } = render(<SeasonLayer season={autumn} />)
    const layer = container.querySelector('.season-layer')
    expect(layer).toBeTruthy()
    expect(layer.getAttribute('aria-hidden')).toBe('true')
    expect(layer.className).toMatch(/pointer-events-none/)
  })

  it('renders the bottom-weighted tint for the season', () => {
    const { container } = render(<SeasonLayer season={autumn} />)
    const tint = container.querySelector('.season-layer > div')
    expect(tint.getAttribute('style')).toContain(autumn.tint)
    expect(tint.getAttribute('style')).toMatch(/to top/)
  })

  it('drifts particles normally but renders none under reduced motion', () => {
    const { container, unmount } = render(<SeasonLayer season={autumn} />)
    expect(container.querySelectorAll('.season-particle').length).toBeGreaterThan(0)
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
      const { container: c2 } = render(<SeasonLayer season={autumn} />)
      expect(c2.querySelectorAll('.season-particle').length).toBe(0)
      // The static tint still conveys the season without motion.
      expect(c2.querySelector('.season-layer > div')).toBeTruthy()
    } finally {
      window.matchMedia = prev
    }
  })

  it('renders nothing when no season is provided', () => {
    const { container } = render(<SeasonLayer season={null} />)
    expect(container.querySelector('.season-layer')).toBeNull()
  })
})
