import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import ComebackMoment from './ComebackMoment.jsx'
import { buildComeback } from '../data/story.js'

const comeback = buildComeback(5, 42)

describe('ComebackMoment', () => {
  it('renders the welcome-back as an accessible dialog with the kind note', () => {
    render(<ComebackMoment comeback={comeback} onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByText(comeback.note)).toBeInTheDocument()
    expect(screen.getByText(/nothing here goes anywhere when you rest/i)).toBeInTheDocument()
  })

  it('greets by the companion name when she has set one', () => {
    render(<ComebackMoment comeback={comeback} companionName="Pip" onClose={() => {}} />)
    expect(screen.getByText(/it's me, Pip\./i)).toBeInTheDocument()
  })

  it('reads as welcoming — no loss, broken-streak, or fault language', () => {
    const { container } = render(<ComebackMoment comeback={comeback} onClose={() => {}} />)
    const text = container.textContent.toLowerCase()
    for (const banned of ['streak', 'lost', 'behind', 'missed', 'fail', 'sorry', 'guilt']) {
      expect(text, `contains "${banned}"`).not.toContain(banned)
    }
  })

  it('closes on Escape and on the close button', () => {
    const onClose = vi.fn()
    render(<ComebackMoment comeback={comeback} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: /close welcome back/i }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('drops the bloom drift under reduced motion (static fallback)', () => {
    const prev = window.matchMedia
    window.matchMedia = (q) => ({
      matches: true,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    })
    try {
      const { container } = render(<ComebackMoment comeback={comeback} onClose={() => {}} />)
      expect(container.querySelectorAll('.animate-float').length).toBe(0)
    } finally {
      window.matchMedia = prev
    }
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<ComebackMoment comeback={comeback} onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
