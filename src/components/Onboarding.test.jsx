import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import Onboarding from './Onboarding.jsx'

// Seed Minimal effects so the typewriter is instant (each beat is "done" at once),
// which keeps the step advancement deterministic.
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    'emily.ui',
    JSON.stringify({ effects: 'minimal', typewriter: true, sounds: 0, onboarded: false }),
  )
})

function setup(over = {}) {
  const props = { onDone: vi.fn(), onSetName: vi.fn(), onSetGoal: vi.fn(), ...over }
  render(<Onboarding {...props} />)
  return props
}

const advance = () => fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))

describe('Onboarding', () => {
  it('opens with the companion greeting in an accessible dialog', () => {
    setup()
    expect(screen.getByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
    expect(screen.getAllByText(/i am the little soot sprite/i).length).toBeGreaterThan(0)
  })

  it('walks through the beats: set a goal, name the companion, then finish', () => {
    const { onDone, onSetName, onSetGoal } = setup()
    advance() // hello -> what
    advance() // what -> goal

    // Goal step: choosing a preset persists it and advances.
    fireEvent.click(screen.getByRole('button', { name: /a solid day/i }))
    expect(onSetGoal).toHaveBeenCalledWith(60)

    // Name step: typing + saving persists the name and advances.
    fireEvent.change(screen.getByLabelText(/a name for the sprite/i), { target: { value: 'Pip' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onSetName).toHaveBeenCalledWith('Pip')

    // Final beat finishes the intro.
    fireEvent.click(screen.getByRole('button', { name: /let us begin/i }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('lets her skip the goal and the name without choosing anything', () => {
    const { onDone, onSetName, onSetGoal } = setup()
    advance()
    advance()
    fireEvent.click(screen.getByRole('button', { name: /decide later/i }))
    expect(onSetGoal).not.toHaveBeenCalled()
    // Name step: Save with an empty field reads as Skip and does not set a name.
    fireEvent.click(screen.getByRole('button', { name: /^skip$/i }))
    expect(onSetName).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /let us begin/i }))
    expect(onDone).toHaveBeenCalled()
  })

  it('"Skip intro" finishes immediately from the first beat', () => {
    const { onDone } = setup()
    fireEvent.click(screen.getByRole('button', { name: /skip intro/i }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<Onboarding onDone={() => {}} onSetName={() => {}} onSetGoal={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
