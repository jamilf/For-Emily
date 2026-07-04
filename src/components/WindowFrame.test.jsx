import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import WindowFrame from './WindowFrame.jsx'

describe('WindowFrame (the dashboard panel chrome)', () => {
  it('renders a labelled section landmark', () => {
    render(
      <WindowFrame title="Pomodoro">
        <p>body</p>
      </WindowFrame>,
    )
    expect(screen.getByRole('region', { name: 'Pomodoro' })).toBeInTheDocument()
  })

  it('exposes its title as a real h2 heading (page outline: h1 greeting, h2 cards)', () => {
    render(
      <WindowFrame title="Focus Meter">
        <p>body</p>
      </WindowFrame>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Focus Meter' })).toBeInTheDocument()
  })

  it('has no axe-detectable violations', async () => {
    const { container } = render(
      <WindowFrame title="My Garden">
        <p>a quiet body</p>
      </WindowFrame>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
