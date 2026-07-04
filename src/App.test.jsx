import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import App from './App.jsx'

// The whole dashboard, mounted for real (providers, scene layers, timer card).
// These are the page-level guarantees the redesign work leans on: the landmark
// skeleton, a logical heading outline, and an axe-clean main view.

beforeEach(() => {
  localStorage.clear()
  // Past the one-time intro; minimal effects keep the render deterministic in
  // jsdom (no typewriters), and the canvas layers all self-guard against
  // jsdom's missing 2D context.
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

  it('keeps every floating piece inside a landmark: nav dock, notepad, contentinfo', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: 'Tools' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Notepad' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('has exactly one h1: the greeting', () => {
    render(<App />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent(/good (morning|afternoon|evening), emily/i)
  })

  it('has a logical heading outline: the h1 first, then the cards as h2 sections', () => {
    render(<App />)
    const headings = screen.getAllByRole('heading')
    expect(headings[0].tagName).toBe('H1')
    // No level is ever skipped going down the outline.
    let prev = 1
    for (const h of headings) {
      const level = Number(h.tagName[1])
      expect(level - prev).toBeLessThanOrEqual(1)
      prev = level
    }
    // The three dashboard cards title themselves.
    expect(screen.getByRole('heading', { level: 2, name: 'Pomodoro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Focus Meter' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'My Garden' })).toBeInTheDocument()
  })

  it('renders the hearth (timer) inside main with its primary action reachable', () => {
    render(<App />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('has no axe-detectable violations on the full dashboard', async () => {
    render(<App />)
    expect(await axe(document.body)).toHaveNoViolations()
  }, 30000)
})
