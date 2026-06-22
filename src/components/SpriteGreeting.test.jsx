import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import SpriteGreeting from './SpriteGreeting.jsx'

describe('SpriteGreeting', () => {
  it('announces the greeting via a polite aria-live region (no focus steal)', () => {
    render(<SpriteGreeting text="hey Emily. the kettle’s on." />)
    const live = screen.getByRole('status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(/the kettle’s on/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders nothing when there is no greeting text', () => {
    const { container } = render(<SpriteGreeting text="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dismisses and notifies the parent', () => {
    const onDismiss = vi.fn()
    render(<SpriteGreeting text="hello" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss greeting/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })

  it('offers to name the sprite only while it is unnamed', () => {
    const { rerender } = render(<SpriteGreeting text="hello" onName={() => {}} />)
    expect(screen.getByRole('button', { name: /give me a name/i })).toBeInTheDocument()
    rerender(<SpriteGreeting text="hello" companionName="Pip" onName={() => {}} />)
    expect(screen.queryByRole('button', { name: /give me a name/i })).not.toBeInTheDocument()
  })

  it('lets her name the companion (reveals the input, saves the value)', () => {
    const onName = vi.fn()
    render(<SpriteGreeting text="hello" onName={onName} />)
    fireEvent.click(screen.getByRole('button', { name: /give me a name/i }))
    const input = screen.getByRole('textbox', { name: /what should you call the sprite/i })
    fireEvent.change(input, { target: { value: 'Pip' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onName).toHaveBeenCalledWith('Pip')
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<SpriteGreeting text="hello there" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
