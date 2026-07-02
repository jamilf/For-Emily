import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import AudioMixerProvider from '../audio/AudioMixerProvider.jsx'
import GroveWindow from './GroveWindow.jsx'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
})

function renderScene(props = {}, children = null) {
  return render(
    <AudioMixerProvider>
      <GroveWindow {...props}>{children}</GroveWindow>
    </AudioMixerProvider>,
  )
}

describe('GroveWindow (the timer diorama)', () => {
  it('renders the scene for the given part of day', () => {
    const { container } = renderScene({ partOfDay: 'night' })
    expect(container.querySelector('[data-daypart="night"]')).toBeTruthy()
  })

  it('falls back to day for an unknown part of day', () => {
    const { container } = renderScene({ partOfDay: 'brunch' })
    expect(container.querySelector('[data-daypart="day"]')).toBeTruthy()
  })

  it('anchors its children (the tree, the companion) inside the scene', () => {
    renderScene({ partOfDay: 'day' }, <button>Talk to the sprite</button>)
    expect(screen.getByRole('button', { name: /talk to the sprite/i })).toBeInTheDocument()
  })

  it('keeps every decorative layer out of the accessibility tree', () => {
    const { container } = renderScene({ partOfDay: 'dusk' })
    // Sky, stars, ground, flora, weather: all aria-hidden; only children carry semantics.
    const decorative = container.querySelectorAll('[aria-hidden="true"]')
    expect(decorative.length).toBeGreaterThanOrEqual(4)
    expect(container.querySelector('canvas').closest('[aria-hidden="true"]')).toBeTruthy()
  })

  it('lights exactly the given fireflies (of 12 fixed spots) and marks the phase', () => {
    const { container } = renderScene({ partOfDay: 'dusk', phase: 'golden', fireflies: 5, warmth: 1 })
    expect(container.querySelector('[data-phase="golden"]')).toBeTruthy()
    const dots = [...container.querySelectorAll('.gw-dot')]
    expect(dots).toHaveLength(12)
    expect(dots.filter((d) => d.style.opacity !== '0')).toHaveLength(5)
  })

  it('shows no fireflies or phase outside a session', () => {
    const { container } = renderScene({ partOfDay: 'day' })
    expect(container.querySelector('[data-daypart]').hasAttribute('data-phase')).toBe(false)
    const dots = [...container.querySelectorAll('.gw-dot')]
    expect(dots.filter((d) => d.style.opacity !== '0')).toHaveLength(0)
  })

  it('plants the named intention as a readable sign in the scene', () => {
    renderScene({ partOfDay: 'day', intention: 'read one page' })
    expect(screen.getByText('read one page')).toBeInTheDocument()
  })

  it('shows no sign when there is no intention to plant', () => {
    const { container } = renderScene({ partOfDay: 'day' })
    expect(container.textContent).not.toMatch(/when i start/i)
  })

  it('has no axe-detectable violations', async () => {
    renderScene({ partOfDay: 'night' }, <button>Talk to the sprite</button>)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
