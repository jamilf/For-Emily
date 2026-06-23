import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import WindowSill from './WindowSill.jsx'

describe('WindowSill', () => {
  it('renders a decorative, non-blocking foreground frame', () => {
    render(<WindowSill />)
    const el = screen.getByTestId('windowsill')
    expect(el).toHaveAttribute('aria-hidden', 'true')
    // pointer-events-none + below the UI (z-[3]) means it can never block content
    expect(el.className).toMatch(/pointer-events-none/)
    expect(el.className).toMatch(/fixed/)
    expect(el.className).toMatch(/z-\[3\]/)
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<WindowSill />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
