import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import AudioMixerProvider from '../audio/AudioMixerProvider.jsx'
import PomodoroTimer from './PomodoroTimer.jsx'
import { sessionSeed } from '../data/treeGrowth.js'

function renderTimer() {
  return render(
    <AudioMixerProvider>
      <PomodoroTimer />
    </AudioMixerProvider>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false })
  vi.setSystemTime(new Date('2026-06-19T09:00:00').getTime())
})
afterEach(() => {
  vi.useRealTimers()
})

describe('PomodoroTimer (timestamp-based countdown)', () => {
  it('starts at 25:00 in focus mode', () => {
    renderTimer()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getAllByText('Ready when you are.').length).toBeGreaterThan(0)
  })

  it('counts down from a wall-clock deadline once started', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByText('In focus.')).toBeInTheDocument()
    // Advancing the clock by 60s (timers + Date) should show 24:00 exactly.
    act(() => vi.advanceTimersByTime(60_000))
    expect(screen.getByText('24:00')).toBeInTheDocument()
  })

  it('does not desync when the tab is backgrounded (catches up on wake)', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    // Simulate a long throttle: clock jumps 10 minutes in one step.
    act(() => vi.advanceTimersByTime(10 * 60_000))
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('resets back to a full 25:00', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(30_000))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getAllByText('Ready when you are.').length).toBeGreaterThan(0)
  })

  it('lets her choose a focus length, which retimes the clock and persists', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: '45 minute focus' }))
    expect(screen.getByText('45:00')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('emily.timer')).focusMin).toBe(45)
  })

  it('records the chosen length (15) as the session minutes on completion', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: '15 minute focus' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(15 * 60_000))
    expect(screen.getByText('Session done.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('emily.stats')).minutesToday).toBe(15)
  })

  it('records a completed focus session to emily.stats when it reaches 0:00', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(25 * 60_000))
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('Session done.')).toBeInTheDocument()
    const stats = JSON.parse(localStorage.getItem('emily.stats'))
    expect(stats.sessionsToday).toBe(1)
    expect(stats.minutesToday).toBe(25)
  })

  it('tapping the companion opens the overworld talk panel, and an action routes through', () => {
    // Minimal effects → instant dialogue typewriter (deterministic in jsdom).
    localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
    const onOpenGrove = vi.fn()
    render(
      <AudioMixerProvider>
        <PomodoroTimer onOpenGrove={onOpenGrove} companionName="Pip" reviewDue={2} onReviewCards={() => {}} />
      </AudioMixerProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /talk to pip/i }))
    expect(screen.getByRole('dialog', { name: /talk to pip/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /wander the grove/i }))
    expect(onOpenGrove).toHaveBeenCalledTimes(1)
  })
})

describe('PomodoroTimer — live tree growth', () => {
  const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  const advance = (ms) => act(() => vi.advanceTimersByTime(ms))

  it('grows the tree through its stages as a 25-minute session runs, announcing each kindly', () => {
    localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
    renderTimer()
    start()
    expect(screen.getByText('Seed planted.')).toBeInTheDocument()

    advance(8 * 60_000) // 0.32 -> sprout
    expect(screen.getByText('Sprouting.')).toBeInTheDocument()
    expect(screen.getByText(/a sprout, unfurling/i)).toBeInTheDocument()

    advance(8 * 60_000) // 0.64 -> sapling
    expect(screen.getByText('Coming along.')).toBeInTheDocument()
    expect(screen.getByText(/a sapling, reaching up/i)).toBeInTheDocument()

    advance(7 * 60_000) // 0.92 -> mature
    expect(screen.getByText('Grown. Into the garden it goes.')).toBeInTheDocument()
    expect(screen.getByText(/grown full and green/i)).toBeInTheDocument()
  })

  it('does not advance the stage while paused (growth tracks active time)', () => {
    renderTimer()
    start()
    advance(8 * 60_000) // sprout
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    advance(10 * 60_000) // would cross thresholds if it kept counting
    expect(screen.getByText('Sprouting.')).toBeInTheDocument()
  })

  it('harvests the same deterministic dna it grew', () => {
    const startTs = new Date('2026-06-19T09:00:00').getTime()
    renderTimer()
    start()
    advance(25 * 60_000)
    const garden = JSON.parse(localStorage.getItem('emily.garden'))
    expect(garden).toHaveLength(1)
    expect(garden[0].id).toBe(sessionSeed({ startTs }))
  })

  it('spends a queued varietal only on a successful harvest', () => {
    localStorage.setItem('emily.grove', JSON.stringify({ unlocked: {}, plantNext: 42 }))
    renderTimer()
    start()
    advance(25 * 60_000)
    const garden = JSON.parse(localStorage.getItem('emily.garden'))
    expect(garden[0].id).toBe(42) // it grew the queued varietal
    expect(JSON.parse(localStorage.getItem('emily.grove')).plantNext).toBeNull()
  })

  it('keeps a queued varietal when the session is abandoned', () => {
    localStorage.setItem('emily.grove', JSON.stringify({ unlocked: {}, plantNext: 42 }))
    renderTimer()
    start()
    advance(60_000)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(JSON.parse(localStorage.getItem('emily.grove')).plantNext).toBe(42)
  })

  it('a break grows nothing', () => {
    renderTimer()
    fireEvent.click(screen.getByRole('button', { name: /rest/i }))
    start()
    advance(5 * 60_000)
    expect(JSON.parse(localStorage.getItem('emily.garden') || '[]')).toHaveLength(0)
  })

  it('has no axe-detectable violations while a tree is growing', async () => {
    renderTimer()
    start()
    advance(8 * 60_000)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' })) // clears the tick interval
    vi.useRealTimers()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})

describe('PomodoroTimer — session bloom + harvest ceremony', () => {
  const start = () => fireEvent.click(screen.getByRole('button', { name: 'Start' }))
  const advance = (ms) => act(() => vi.advanceTimersByTime(ms))
  const scene = () => document.body.querySelector('[data-daypart]')

  it('the scene moves settling -> growing -> golden as the session runs', () => {
    renderTimer()
    start()
    expect(scene().getAttribute('data-phase')).toBe('settling')
    advance(9 * 60_000) // 0.36 of 25 min
    expect(scene().getAttribute('data-phase')).toBe('growing')
    advance(15.5 * 60_000) // 24.5 min: inside the final minute
    expect(scene().getAttribute('data-phase')).toBe('golden')
  })

  it('keeps exactly ONE live region in the card, announcing milestones kindly', () => {
    const { container } = renderTimer()
    const regions = container.querySelectorAll('[aria-live]')
    expect(regions).toHaveLength(1)
    start()
    expect(regions[0].textContent).toMatch(/a seed, tucked into the soil/i)
    expect(regions[0].textContent).toMatch(/the grove settles in with you/i)
    advance(9 * 60_000)
    expect(regions[0].textContent).toMatch(/fireflies are starting to gather/i)
  })

  it('completion opens the harvest ceremony, and Esc hands off into the reflection', async () => {
    localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
    renderTimer()
    start()
    advance(25 * 60_000)
    vi.useRealTimers() // let the lazy overlays resolve
    const ceremony = await screen.findByRole('dialog', { name: /a little harvest/i })
    expect(ceremony).toHaveTextContent(/one more tree for your grove/i)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(await screen.findByRole('dialog', { name: /session reflection/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /a little harvest/i })).not.toBeInTheDocument()
  })

  it('the ceremony shows her intention back and its Continue button also advances', async () => {
    localStorage.setItem('emily.ui', JSON.stringify({ effects: 'minimal', onboarded: true }))
    renderTimer()
    fireEvent.change(screen.getByLabelText(/when i start, i will/i), {
      target: { value: 'read one page' },
    })
    start()
    advance(25 * 60_000)
    vi.useRealTimers()
    const ceremony = await screen.findByRole('dialog', { name: /a little harvest/i })
    expect(ceremony).toHaveTextContent(/read one page/)
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(await screen.findByRole('dialog', { name: /session reflection/i })).toBeInTheDocument()
  })

  it('an abandoned session shows no loss language and returns to a quiet scene', () => {
    renderTimer()
    start()
    advance(6 * 60_000)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getAllByText('Ready when you are.').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/lost|wasted|failed|gave up|broke/i)
    expect(scene().hasAttribute('data-phase')).toBe(false)
  })
})
