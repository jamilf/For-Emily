import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AudioMixerProvider from '../audio/AudioMixerProvider.jsx'
import PomodoroTimer from './PomodoroTimer.jsx'

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
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument()
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
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument()
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
})
