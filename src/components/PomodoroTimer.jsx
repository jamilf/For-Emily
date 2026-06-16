import { useEffect, useState } from 'react'
import QuoteModal from './QuoteModal.jsx'
import { QUOTES } from '../data/quotes.js'

// Durations in seconds. Focus is the default; break is framed as gentle rest.
const DURATIONS = {
  focus: 25 * 60,
  break: 5 * 60,
}

// Geometry for the SVG progress ring.
const RADIUS = 130
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Widget 2 — The Spirited Pomodoro (centerpiece).
 * 25-min focus / 5-min break, with a depleting ring, a leaf counter for
 * banked sessions, and a soot sprite that naps while you work and wakes
 * with mail when the timer finishes.
 */
export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [hasMail, setHasMail] = useState(false) // sprite woke with an envelope
  const [quote, setQuote] = useState(null) // open modal when set

  const total = DURATIONS[mode]

  // The one unavoidable JS loop: tick down once per second while running.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Handle completion when the clock reaches zero.
  useEffect(() => {
    if (secondsLeft !== 0 || !running) return
    setRunning(false)
    if (mode === 'focus') {
      setSessionsToday((n) => n + 1) // bank a leaf
    }
    setHasMail(true) // the soot sprite wakes with mail
  }, [secondsLeft, running, mode])

  function switchMode(next) {
    setMode(next)
    setSecondsLeft(DURATIONS[next])
    setRunning(false)
    setHasMail(false)
  }

  function handleStartPause() {
    if (secondsLeft === 0) return // finished; reset first
    setRunning((r) => !r)
    setHasMail(false) // back to napping when we resume work
  }

  function handleReset() {
    setRunning(false)
    setSecondsLeft(DURATIONS[mode])
    setHasMail(false)
  }

  function openQuote() {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }

  // Ring "depletes": the drawn arc shrinks toward zero as time runs down.
  const remainingFraction = total > 0 ? secondsLeft / total : 0
  const dashOffset = CIRCUMFERENCE * (1 - remainingFraction)

  // Sprite is "napping" only while actively counting down a focus session.
  const napping = running

  return (
    <section
      aria-label="The Spirited Pomodoro timer"
      className="flex flex-col items-center rounded-3xl bg-latte p-6 text-brownDark shadow-cozy"
    >
      <h2 className="mb-4 font-serif text-2xl font-semibold">
        The Spirited Pomodoro <span aria-hidden="true">⏳</span>
      </h2>

      {/* Mode toggle */}
      <div
        role="group"
        aria-label="Timer mode"
        className="mb-6 flex gap-1 rounded-full bg-brown/10 p-1 text-sm"
      >
        <button
          onClick={() => switchMode('focus')}
          aria-pressed={mode === 'focus'}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === 'focus'
              ? 'bg-brown text-cream'
              : 'text-brown hover:bg-brown/10'
          }`}
        >
          Focus · 25
        </button>
        <button
          onClick={() => switchMode('break')}
          aria-pressed={mode === 'break'}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
            mode === 'break'
              ? 'bg-ever-green text-forest'
              : 'text-brown hover:bg-brown/10'
          }`}
        >
          Rest · 5
        </button>
      </div>

      {/* Ring + time */}
      <div className="relative h-72 w-72">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 300 300"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="150"
            cy="150"
            r={RADIUS}
            fill="none"
            stroke="rgba(143,94,54,0.15)"
            strokeWidth="14"
          />
          {/* Depleting progress */}
          <circle
            cx="150"
            cy="150"
            r={RADIUS}
            fill="none"
            stroke={mode === 'focus' ? '#8F5E36' : '#A7C080'}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Time + status sit inside the ring. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {/* No aria-live here: announcing every second would overwhelm a
              screen reader. The status line below speaks state changes. */}
          <span className="font-serif text-6xl font-semibold tabular-nums">
            {format(secondsLeft)}
          </span>
          <span className="mt-1 text-sm text-brown" aria-live="polite">
            {secondsLeft === 0
              ? mode === 'focus'
                ? 'Beautiful work 💌'
                : 'Welcome back 🌿'
              : running
                ? mode === 'focus'
                  ? 'Settling in… 🌙'
                  : 'Resting gently…'
                : mode === 'focus'
                  ? 'Ready when you are'
                  : 'A little rest is earned'}
          </span>
        </div>
      </div>

      {/* Controls — start is one tap. */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleStartPause}
          disabled={secondsLeft === 0}
          className="rounded-2xl bg-brown px-7 py-2.5 font-medium text-cream shadow-sm transition-colors hover:bg-brownDark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Pause' : secondsLeft === 0 ? 'Done' : 'Start'}
        </button>
        <button
          onClick={handleReset}
          className="rounded-2xl bg-brown/10 px-7 py-2.5 font-medium text-brown transition-colors hover:bg-brown/20"
        >
          Reset
        </button>
      </div>

      {/* Banked focus sessions — visible accumulation. */}
      <div className="mt-6 text-center">
        <p className="text-sm text-brown">Focus sessions today</p>
        <div className="mt-1 flex min-h-[28px] flex-wrap items-center justify-center gap-0.5">
          {sessionsToday === 0 ? (
            <span className="text-sm text-brown/60">
              Your first leaf is one session away 🍃
            </span>
          ) : (
            Array.from({ length: sessionsToday }).map((_, i) => (
              <span
                key={i}
                className="animate-leaf-pop text-xl"
                aria-hidden="true"
              >
                🍃
              </span>
            ))
          )}
        </div>
        {sessionsToday > 0 && (
          <span className="sr-only">{sessionsToday} sessions completed</span>
        )}
      </div>

      {/* Soot sprite — naps while you work, wakes with mail at 00:00. */}
      <div className="relative mt-6 flex h-24 w-full items-end justify-center overflow-hidden">
        <button
          onClick={openQuote}
          aria-label="Open a little note from the soot sprite"
          className={`group relative rounded-full transition-opacity ${
            napping ? 'opacity-50' : 'opacity-100'
          } ${hasMail ? 'animate-soot-rise' : 'animate-soot-bob'}`}
        >
          {/* Fuzzy black body */}
          <span
            aria-hidden="true"
            className="relative block h-14 w-14 rounded-full bg-neutral-900"
            style={{ boxShadow: '0 0 7px 3px rgba(0,0,0,0.55)' }}
          >
            {/* spiky tufts */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2 h-3 w-1.5 rounded-full bg-neutral-900"
                style={{
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-26px)`,
                }}
              />
            ))}

            {/* Eyes: open dots, or closed lines while napping. */}
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-2">
              {napping ? (
                <>
                  <span className="h-0.5 w-2.5 rounded-full bg-white/90" />
                  <span className="h-0.5 w-2.5 rounded-full bg-white/90" />
                </>
              ) : (
                <>
                  <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white">
                    <span className="h-1 w-1 rounded-full bg-neutral-900" />
                  </span>
                  <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white">
                    <span className="h-1 w-1 rounded-full bg-neutral-900" />
                  </span>
                </>
              )}
            </span>
          </span>

          {/* Envelope appears when the sprite wakes with mail. */}
          {hasMail && (
            <span
              className="absolute -right-3 -top-2 text-2xl"
              aria-hidden="true"
            >
              ✉️
            </span>
          )}
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-brown/70">
        {hasMail
          ? 'Tap the soot sprite — it brought you a note.'
          : napping
            ? 'Shh… the soot sprite is napping while you focus.'
            : 'Tap the soot sprite for a little encouragement.'}
      </p>

      {quote && <QuoteModal quote={quote} onClose={() => setQuote(null)} />}
    </section>
  )
}
