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
      <button onClick={() => s.dismissComeback()}>dismiss</button>
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
})
