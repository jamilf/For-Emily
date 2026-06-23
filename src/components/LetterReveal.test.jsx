import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import LetterReveal from './LetterReveal.jsx'
import { MILESTONES } from '../data/story.js'

const letter = MILESTONES[0]

describe('LetterReveal', () => {
  it('announces the letter via an aria-live region without trapping focus', () => {
    render(<LetterReveal letter={letter} onRead={() => {}} onAck={() => {}} />)
    const live = screen.getByRole('status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(letter.title)).toBeInTheDocument()
    expect(screen.getByText(letter.lines[0])).toBeInTheDocument() // first line as a teaser
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument() // a toast, not a modal
  })

  it('names the companion when she has one, falling back gently otherwise', () => {
    const { rerender } = render(<LetterReveal letter={letter} onRead={() => {}} onAck={() => {}} />)
    expect(screen.getByText(/a letter from your soot friend/i)).toBeInTheDocument()
    rerender(<LetterReveal letter={letter} companionName="Pip" onRead={() => {}} onAck={() => {}} />)
    expect(screen.getByText(/a letter from pip/i)).toBeInTheDocument()
  })

  it('"Read it" opens the story and acknowledges the letter', () => {
    const onRead = vi.fn()
    const onAck = vi.fn()
    render(<LetterReveal letter={letter} onRead={onRead} onAck={onAck} />)
    fireEvent.click(screen.getByRole('button', { name: /read it/i }))
    expect(onRead).toHaveBeenCalledTimes(1)
    expect(onAck).toHaveBeenCalledWith(letter.id)
  })

  it('"Maybe later" acknowledges (so it never re-shows) without opening the story', () => {
    const onRead = vi.fn()
    const onAck = vi.fn()
    render(<LetterReveal letter={letter} onRead={onRead} onAck={onAck} />)
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }))
    expect(onAck).toHaveBeenCalledWith(letter.id)
    expect(onRead).not.toHaveBeenCalled()
    expect(screen.queryByText(letter.title)).not.toBeInTheDocument() // dismissed
  })

  it('drops the entrance animation under reduced motion', () => {
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
      const { container } = render(<LetterReveal letter={letter} onRead={() => {}} onAck={() => {}} />)
      expect(container.querySelectorAll('.animate-slide-up').length).toBe(0)
    } finally {
      window.matchMedia = prev
    }
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<LetterReveal letter={letter} onRead={() => {}} onAck={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
