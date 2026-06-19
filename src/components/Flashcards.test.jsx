import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Flashcards from './Flashcards.jsx'

const PAST = Date.now() - 2 * 24 * 60 * 60 * 1000

function seed(cards) {
  localStorage.setItem('emily.flashcards', JSON.stringify(cards))
}
const DECK = [
  { id: 1, deck: 'D', front: 'Q1', back: 'A1', box: 2, due: PAST, interval: 3, reps: 1, struggling: 0 },
  { id: 2, deck: 'D', front: 'Q2', back: 'A2', box: 2, due: PAST, interval: 3, reps: 1, struggling: 0 },
]

beforeEach(() => localStorage.clear())

// Turn off shuffle so queue order is deterministic (card 1, then card 2).
function startReview() {
  fireEvent.click(screen.getByLabelText(/shuffle/i))
  fireEvent.click(screen.getByRole('button', { name: /review \d+ card/i }))
}

describe('Flashcards — review, reschedule, undo, resume', () => {
  it('rates a card, reschedules it, and persists the in-progress session', () => {
    seed(DECK)
    render(<Flashcards onClose={() => {}} />)
    startReview()
    expect(screen.getByText('Reviewing 1 of 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /3\. Good/ }))

    // Advanced to the second card, and the session is persisted for resume.
    expect(screen.getByText('Reviewing 2 of 2')).toBeInTheDocument()
    const session = JSON.parse(localStorage.getItem('emily.flashSession'))
    expect(session.idx).toBe(1)
    // Card 1 was promoted (box 2 → 3) and rescheduled into the future.
    const cards = JSON.parse(localStorage.getItem('emily.flashcards'))
    const c1 = cards.find((c) => c.id === 1)
    expect(c1.box).toBe(3)
    expect(c1.reps).toBe(2)
    expect(c1.due).toBeGreaterThan(Date.now())
  })

  it('undoes the last rating (misclick recovery), restoring the schedule', () => {
    seed(DECK)
    render(<Flashcards onClose={() => {}} />)
    startReview()
    fireEvent.click(screen.getByRole('button', { name: /show answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /3\. Good/ }))
    expect(screen.getByText('Reviewing 2 of 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /undo last/i }))
    expect(screen.getByText('Reviewing 1 of 2')).toBeInTheDocument()
    const c1 = JSON.parse(localStorage.getItem('emily.flashcards')).find((c) => c.id === 1)
    expect(c1.box).toBe(2) // restored
    expect(c1.reps).toBe(1)
  })

  it('offers to resume an interrupted session exactly where she left off', () => {
    seed(DECK)
    localStorage.setItem('emily.flashSession', JSON.stringify({ ids: [1, 2], idx: 1, deck: null }))
    render(<Flashcards onClose={() => {}} />)
    const resume = screen.getByRole('button', { name: /resume your review — card 2 of 2/i })
    fireEvent.click(resume)
    expect(screen.getByText('Reviewing 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('Q2')).toBeInTheDocument()
  })

  it('imports pasted cards, skipping duplicates', () => {
    seed([{ id: 9, deck: 'Bio', front: 'axon', back: 'sends signals', box: 1, due: PAST, reps: 0 }])
    render(<Flashcards onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /⬆ import/i }))
    fireEvent.change(screen.getByPlaceholderText(/deck for these cards/i), { target: { value: 'Bio' } })
    const textarea = screen.getByPlaceholderText(/one card per line/i)
    fireEvent.change(textarea, { target: { value: 'axon — sends signals\ndendrite — receives signals' } })
    fireEvent.click(screen.getByRole('button', { name: /add cards/i }))
    // One added (dendrite), one duplicate (axon) skipped.
    const cards = JSON.parse(localStorage.getItem('emily.flashcards'))
    expect(cards.some((c) => c.front === 'dendrite')).toBe(true)
    expect(cards.filter((c) => c.front === 'axon')).toHaveLength(1)
  })
})
