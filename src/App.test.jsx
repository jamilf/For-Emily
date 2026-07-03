import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import App from './App.jsx'

// The whole dashboard, mounted for real (providers, scene layers, timer card).
// These are the page-level guarantees the redesign work leans on: the landmark
// skeleton, one h1, a skip link, and an axe-clean main view.

beforeEach(() => {
  localStorage.clear()
  // Past the one-time intro, and quiet the ambient toasts' story derivations by
  // marking today as already seen (a fresh lastSeen means a greeting, which is
  // fine — it must also be axe-clean).
  localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
})

describe('App — the main view', () => {
  it('has the landmark skeleton: banner, main, and a skip link to it', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
    const skip = screen.getByRole('link', { name: /skip to main content/i })
    expect(skip).toHaveAttribute('href', '#main-content')
  })

  it('has exactly one h1: the greeting', () => {
    render(<App />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent(/good (morning|afternoon|evening), emily/i)
  })

  it('renders the hearth (timer) inside main with its primary action reachable', () => {
    render(<App />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('has no axe-detectable violations on the full dashboard', async () => {
    const { container } = render(<App />)
    expect(await axe(container)).toHaveNoViolations()
  }, 30000)
})
