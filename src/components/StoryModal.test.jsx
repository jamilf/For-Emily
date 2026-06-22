import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import StoryModal from './StoryModal.jsx'

// 10 grown trees → chapters 1–4 unlocked; current = Lanternlight (grown >= 10).
function seed(n = 10) {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('StoryModal', () => {
  it('renders as an accessible dialog of the chapters reached', () => {
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /grove story/i })).toBeInTheDocument()
    expect(screen.getByText('The Grove Stirs')).toBeInTheDocument()
    expect(screen.getByText('Lanternlight')).toBeInTheDocument()
    // Current chapter marked by TEXT, not colour alone.
    expect(screen.getByText(/you are here/i)).toBeInTheDocument()
  })

  it('shows a spoiler-free hint that more is ahead', () => {
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    expect(screen.getByText(/something new is waiting up ahead/i)).toBeInTheDocument()
    // The next chapter's title is NOT revealed.
    expect(screen.queryByText('The Hollow Wakes')).not.toBeInTheDocument()
  })

  it('invites her to begin when no chapter has opened yet', () => {
    render(<StoryModal onClose={() => {}} />) // empty garden
    expect(screen.getByText(/your story begins with your first focus session/i)).toBeInTheDocument()
  })

  it('acknowledges the current chapter on open (so its reveal never nags again)', () => {
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    const story = JSON.parse(localStorage.getItem('emily.story'))
    expect(story.ackChapters.lanternlight).toBe(true)
  })

  it('closes on Escape', () => {
    seed(10)
    const onClose = vi.fn()
    render(<StoryModal onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has no axe-detectable accessibility violations', async () => {
    seed(10)
    const { container } = render(<StoryModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
