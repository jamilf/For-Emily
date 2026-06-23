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

  it('lets her leave a keeper note that persists and reads back as "you wrote"', () => {
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    fireEvent.click(screen.getAllByRole('button', { name: /leave a note/i })[0])
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'i finished my essay today' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(screen.getByText(/you wrote/i)).toBeInTheDocument()
    expect(screen.getByText('i finished my essay today')).toBeInTheDocument()
    // The first unlocked chapter is "stirs"; its note is persisted to emily.story.
    expect(JSON.parse(localStorage.getItem('emily.story')).notes.stirs).toBe('i finished my essay today')
  })

  it('can clear a note again', () => {
    seed(10)
    localStorage.setItem(
      'emily.story',
      JSON.stringify({ lastSeen: 1, ackChapters: {}, comebackShown: {}, notes: { stirs: 'a kept line' } }),
    )
    render(<StoryModal onClose={() => {}} />)
    expect(screen.getByText('a kept line')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }))
    expect(screen.queryByText('a kept line')).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('emily.story')).notes.stirs).toBeUndefined()
  })

  it('shelves earned milestone letters to re-read, with a signature', () => {
    seed(10) // grown >= 5 earns the "five-trees" letter
    render(<StoryModal onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: /letters from your soot friend/i })).toBeInTheDocument()
    expect(screen.getByText('Five little trees')).toBeInTheDocument()
    expect(screen.getAllByText(/all my love, your soot friend/i).length).toBeGreaterThan(0)
  })

  it('signs the letters with the companion name when she has given one', () => {
    localStorage.setItem(
      'emily.story',
      JSON.stringify({ lastSeen: 1, ackChapters: {}, comebackShown: {}, companionName: 'Pip' }),
    )
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: /letters from pip/i })).toBeInTheDocument()
    expect(screen.getByText(/all my love, pip/i)).toBeInTheDocument()
  })

  it('acknowledges earned letters on open (so their toast never nags again)', () => {
    seed(10)
    render(<StoryModal onClose={() => {}} />)
    expect(JSON.parse(localStorage.getItem('emily.story')).letterAcks['five-trees']).toBe(true)
  })

  it('shows no letters section before any milestone is reached', () => {
    seed(2) // grown < 5, no letter earned
    render(<StoryModal onClose={() => {}} />)
    expect(screen.queryByRole('heading', { name: /letters from/i })).not.toBeInTheDocument()
  })

  it('has no axe-detectable accessibility violations', async () => {
    seed(10)
    const { container } = render(<StoryModal onClose={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
