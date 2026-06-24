import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import CommandButton from './CommandButton.jsx'

beforeEach(() => localStorage.clear())

describe('CommandButton', () => {
  it('renders its label and fires onClick (sound is a safe no-op without a provider)', () => {
    const onClick = vi.fn()
    render(<CommandButton onClick={onClick}>Start</CommandButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('respects the disabled state', () => {
    const onClick = vi.fn()
    render(
      <CommandButton onClick={onClick} disabled>
        Nope
      </CommandButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nope' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no axe-detectable violations', async () => {
    const { container } = render(<CommandButton>Confirm</CommandButton>)
    expect(await axe(container)).toHaveNoViolations()
  })
})
