import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import AppearanceSettings from './AppearanceSettings.jsx'

const readUi = () => JSON.parse(localStorage.getItem('emily.ui'))

beforeEach(() => localStorage.clear())

describe('AppearanceSettings', () => {
  it('persists the effects intensity choice', () => {
    render(<AppearanceSettings />)
    fireEvent.change(screen.getByRole('combobox', { name: /effects intensity/i }), {
      target: { value: 'calm' },
    })
    expect(readUi().effects).toBe('calm')
  })

  it('toggles the dialogue typewriter and persists it', () => {
    render(<AppearanceSettings />)
    const cb = screen.getByRole('checkbox', { name: /dialogue typewriter/i })
    expect(cb).toBeChecked() // on by default
    fireEvent.click(cb)
    expect(readUi().typewriter).toBe(false)
  })

  it('persists the menu sound volume (off by default)', () => {
    render(<AppearanceSettings />)
    expect(screen.getByText('off')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: /menu sound volume/i }), {
      target: { value: '0.3' },
    })
    expect(readUi().sounds).toBe(0.3)
  })

  it('has no axe-detectable violations', async () => {
    const { container } = render(<AppearanceSettings />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
