import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import ChapterReveal from './ChapterReveal.jsx'
import { CHAPTERS } from '../data/story.js'

const chapter = CHAPTERS[0]

describe('ChapterReveal', () => {
  it('announces the new chapter via an aria-live region without trapping focus', () => {
    render(<ChapterReveal chapter={chapter} onRead={() => {}} onAck={() => {}} />)
    const live = screen.getByRole('status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(chapter.title)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument() // a toast, not a modal
  })

  it('"Read it" opens the story and acknowledges the chapter', () => {
    const onRead = vi.fn()
    const onAck = vi.fn()
    render(<ChapterReveal chapter={chapter} onRead={onRead} onAck={onAck} />)
    fireEvent.click(screen.getByRole('button', { name: /read it/i }))
    expect(onRead).toHaveBeenCalledTimes(1)
    expect(onAck).toHaveBeenCalledWith(chapter.id)
  })

  it('"Maybe later" acknowledges (so it never re-shows) without opening the story', () => {
    const onRead = vi.fn()
    const onAck = vi.fn()
    render(<ChapterReveal chapter={chapter} onRead={onRead} onAck={onAck} />)
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }))
    expect(onAck).toHaveBeenCalledWith(chapter.id)
    expect(onRead).not.toHaveBeenCalled()
    expect(screen.queryByText(chapter.title)).not.toBeInTheDocument() // dismissed
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
      const { container } = render(<ChapterReveal chapter={chapter} onRead={() => {}} onAck={() => {}} />)
      expect(container.querySelectorAll('.animate-slide-up').length).toBe(0)
    } finally {
      window.matchMedia = prev
    }
  })

  it('has no axe-detectable accessibility violations', async () => {
    const { container } = render(<ChapterReveal chapter={chapter} onRead={() => {}} onAck={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
