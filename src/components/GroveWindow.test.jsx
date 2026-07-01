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

  it('has no axe-detectable violations', async () => {
    renderScene({ partOfDay: 'night' }, <button>Talk to the sprite</button>)
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
