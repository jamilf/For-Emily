import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import useStory from './useStory.js'
import { RETURN, comebackDayKey } from '../data/story.js'

const DAY = 24 * 60 * 60 * 1000

function Harness() {
  const s = useStory()
  return (
    <div>
      <span data-testid="ret">{s.returnType}</span>
      <span data-testid="comeback">{s.comeback ? 'yes' : 'no'}</span>
      <span data-testid="chapter">{s.currentChapter?.id || 'none'}</span>
      <span data-testid="unseen">{s.unseenChapter?.id || 'none'}</span>
      <span data-testid="letters">{s.letters.map((l) => l.id).join(',') || 'none'}</span>
      <span data-testid="unseen-letter">{s.unseenLetter?.id || 'none'}</span>
      <button onClick={() => s.dismissComeback()}>dismiss</button>
      <button onClick={() => s.unseenLetter && s.ackLetter(s.unseenLetter.id)}>ack letter</button>
    </div>
  )
}

function seedGarden(n) {
  localStorage.setItem(
    'emily.garden',
    JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('useStory', () => {
  it('a fresh install reads as first-day with no comeback, and stamps lastSeen', () => {
    render(<Harness />)
    expect(screen.getByTestId('ret').textContent).toBe(RETURN.FIRST)
    expect(screen.getByTestId('comeback').textContent).toBe('no')
    // lastSeen was stamped to "now" on open (the return signal for next time).
    expect(JSON.parse(localStorage.getItem('emily.story')).lastSeen).toBeGreaterThan(0)
  })

  it('a long gap yields a single welcome-back comeback', () => {
    seedGarden(10)
    localStorage.setItem(
      'emily.story',
      JSON.stringify({ lastSeen: Date.now() - 5 * DAY, seenBeats: {}, ackChapters: {}, comebackShown: {} }),
    )
    render(<Harness />)
    expect(screen.getByTestId('ret').textContent).toBe(RETURN.LONG)
    expect(screen.getByTestId('comeback').textContent).toBe('yes')
  })

  it('does not re-show the comeback once it has been shown today', () => {
    seedGarden(10)
    localStorage.setItem(
      'emily.story',
      JSON.stringify({
        lastSeen: Date.now() - 5 * DAY,
        seenBeats: {},
        ackChapters: {},
        comebackShown: { [comebackDayKey()]: true },
      }),
    )
    render(<Harness />)
    expect(screen.getByTestId('comeback').textContent).toBe('no')
  })

  it('dismissing the comeback marks it shown for the day', () => {
    seedGarden(10)
    localStorage.setItem(
      'emily.story',
      JSON.stringify({ lastSeen: Date.now() - 5 * DAY, seenBeats: {}, ackChapters: {}, comebackShown: {} }),
    )
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.getByTestId('comeback').textContent).toBe('no')
    expect(JSON.parse(localStorage.getItem('emily.story')).comebackShown[comebackDayKey()]).toBe(true)
  })

  it('surfaces the current chapter as unseen until it is acknowledged', () => {
    seedGarden(3) // unlocks through "mossbright"
    render(<Harness />)
    expect(screen.getByTestId('chapter').textContent).toBe('mossbright')
    expect(screen.getByTestId('unseen').textContent).toBe('mossbright')
  })

  it('surfaces the first earned letter as unseen, in MILESTONES order', () => {
    seedGarden(5) // earns the "five-trees" letter
    render(<Harness />)
    expect(screen.getByTestId('letters').textContent).toBe('five-trees')
    expect(screen.getByTestId('unseen-letter').textContent).toBe('five-trees')
  })

  it('acking a letter writes letterAcks and stops surfacing it', () => {
    seedGarden(5)
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /ack letter/i }))
    expect(screen.getByTestId('unseen-letter').textContent).toBe('none')
    expect(JSON.parse(localStorage.getItem('emily.story')).letterAcks['five-trees']).toBe(true)
  })

  it('no letter is earned, or surfaced, before any milestone', () => {
    seedGarden(1)
    render(<Harness />)
    expect(screen.getByTestId('letters').textContent).toBe('none')
    expect(screen.getByTestId('unseen-letter').textContent).toBe('none')
  })
})
