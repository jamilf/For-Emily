import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import AudioMixerProvider from '../audio/AudioMixerProvider.jsx'
import AmbientMixerDrawer from './AmbientMixerDrawer.jsx'

// The drawer is rendered inside the real provider but Start is never clicked, so no
// AudioContext is created (jsdom has none) — selecting a style only persists state.
function renderDrawer() {
  return render(
    <AudioMixerProvider>
      <AmbientMixerDrawer onClose={() => {}} />
    </AudioMixerProvider>,
  )
}

const readMixer = () => JSON.parse(localStorage.getItem('emily.mixer'))

beforeEach(() => localStorage.clear())
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('AmbientMixerDrawer — Sound & Music', () => {
  it('renders as the Sound & Music dialog with a focus-music picker', () => {
    renderDrawer()
    expect(screen.getByRole('dialog', { name: /sound & music/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /focus music style/i })).toBeInTheDocument()
    for (const name of ['Off', 'Ghibli', 'Classical', 'Lofi', 'Rain Piano']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('marks the current style with aria-pressed (Off by default)', () => {
    renderDrawer()
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Lofi' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('selecting a style persists it to emily.mixer.musicStyle', () => {
    renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Lofi' }))
    expect(screen.getByRole('button', { name: 'Lofi' })).toHaveAttribute('aria-pressed', 'true')
    expect(readMixer().musicStyle).toBe('lofi')
    // and back to Off
    fireEvent.click(screen.getByRole('button', { name: 'Off' }))
    expect(readMixer().musicStyle).toBe('off')
  })

  it('persists the music volume independently of the master volume', () => {
    renderDrawer()
    fireEvent.change(screen.getByLabelText(/music volume/i), { target: { value: '0.3' } })
    expect(readMixer().musicVolume).toBe(0.3)
    expect(readMixer().master).toBe(0.7) // untouched
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = renderDrawer()
    expect(await axe(container)).toHaveNoViolations()
  })
})
