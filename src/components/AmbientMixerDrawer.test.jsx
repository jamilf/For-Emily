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
  it('renders as the Sound & Music dialog with a labeled focus-music picker', () => {
    renderDrawer()
    expect(screen.getByRole('dialog', { name: /sound & music/i })).toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: /focus music/i })
    expect(select).toBeInTheDocument()
    // Off + Auto, plus both grouped sections.
    for (const name of ['Off', 'Auto', 'Ghibli', 'Late-night Library']) {
      expect(screen.getByRole('option', { name })).toBeInTheDocument()
    }
  })

  it('reflects the current style in the select value (Off by default)', () => {
    renderDrawer()
    expect(screen.getByRole('combobox', { name: /focus music/i })).toHaveValue('off')
  })

  it('selecting a mood persists it to emily.mixer.musicStyle and shows a now-playing hint', () => {
    renderDrawer()
    const select = screen.getByRole('combobox', { name: /focus music/i })
    fireEvent.change(select, { target: { value: 'latenight' } })
    expect(select).toHaveValue('latenight')
    expect(readMixer().musicStyle).toBe('latenight')
    expect(screen.getByText(/now playing: late-night library/i)).toBeInTheDocument()
    // and back to Off
    fireEvent.change(select, { target: { value: 'off' } })
    expect(readMixer().musicStyle).toBe('off')
  })

  it('only the five ambient layers render (Coffee Shop / Brown Noise removed)', () => {
    renderDrawer()
    for (const label of ['Steady Rain', 'Fireplace']) {
      expect(screen.getByLabelText(new RegExp(`${label} volume`, 'i'))).toBeInTheDocument()
    }
    for (const gone of [/coffee/i, /brown noise/i]) {
      expect(screen.queryByLabelText(gone)).not.toBeInTheDocument()
    }
  })

  it('the entrainment toggle is opt-in, honestly labeled, and persists', () => {
    renderDrawer()
    const toggle = screen.getByRole('checkbox', { name: /steady pulse/i })
    expect(toggle).not.toBeChecked() // off by default
    expect(screen.getByText(/it may\s+do nothing/i)).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toBeChecked()
    expect(readMixer().entrainment).toBe(true)
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
