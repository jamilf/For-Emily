import { useEffect, useState } from 'react'
import QuoteModal from './QuoteModal.jsx'
import { QUOTES } from '../data/quotes.js'

const DURATIONS = {
  focus: 25 * 60,
  break: 5 * 60,
}

const RADIUS = 130
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * The leading-edge x/y on the progress arc.
 * The SVG is rotated -90° by CSS, so arc angle 0 = visual 12 o'clock.
 * fraction = 1 → full circle (tip at 12 o'clock); fraction = 0 → empty.
 */
function tipCoords(fraction) {
  const angle = fraction * 2 * Math.PI
  return {
    cx: 150 + RADIUS * Math.cos(angle),
    cy: 150 + RADIUS * Math.sin(angle),
  }
}

/**
 * Widget 2 — The Spirited Pomodoro (centerpiece).
 */
export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [hasMail, setHasMail] = useState(false)
  const [quote, setQuote] = useState(null)

  const total = DURATIONS[mode]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return
    setRunning(false)
    if (mode === 'focus') setSessionsToday((n) => n + 1)
    setHasMail(true)
  }, [secondsLeft, running, mode])

  function switchMode(next) {
    setMode(next)
    setSecondsLeft(DURATIONS[next])
    setRunning(false)
    setHasMail(false)
  }

  function handleStartPause() {
    if (secondsLeft === 0) return
    setRunning((r) => !r)
    setHasMail(false)
  }

  function handleReset() {
    setRunning(false)
    setSecondsLeft(DURATIONS[mode])
    setHasMail(false)
  }

  function openQuote() {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }

  const remainingFraction = total > 0 ? secondsLeft / total : 0
  const dashOffset = CIRCUMFERENCE * (1 - remainingFraction)
  const napping = running
  const strokeColour = mode === 'focus' ? '#8F5E36' : '#A7C080'
  const glowColour  = mode === 'focus' ? '#DBBC7F' : '#83C092'

  // Show the invite pulse only when completely idle at the start of a session.
  const showInvitePulse = !running && secondsLeft === total

  const tip = tipCoords(remainingFraction)

  return (
    <section
      aria-label="The Spirited Pomodoro timer"
      className="widget-glass flex flex-col items-center bg-latte/95 p-6 text-brownDark transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.012]"
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
          className={`rounded-full px-5 py-1.5 font-medium transition-all duration-200 ${
            mode === 'focus'
              ? 'bg-brown text-cream shadow-sm scale-[1.04]'
              : 'text-brown hover:bg-brown/10'
          }`}
        >
          Focus · 25
        </button>
        <button
          onClick={() => switchMode('break')}
          aria-pressed={mode === 'break'}
          className={`rounded-full px-5 py-1.5 font-medium transition-all duration-200 ${
            mode === 'break'
              ? 'bg-ever-green text-forest shadow-sm scale-[1.04]'
              : 'text-brown hover:bg-brown/10'
          }`}
        >
          Rest · 5
        </button>
      </div>

      {/* SVG ring + countdown — responsive size */}
      <div className="relative h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72">
        <svg
          className="h-full w-full -rotate-90"
          viewBox="0 0 300 300"
          aria-hidden="true"
        >
          {/* Track ring */}
          <circle
            cx="150" cy="150" r={RADIUS}
            fill="none"
            stroke="rgba(143,94,54,0.12)"
            strokeWidth="16"
          />

          {/* Subtle glow copy behind the progress arc (blurred) */}
          <circle
            cx="150" cy="150" r={RADIUS}
            fill="none"
            stroke={glowColour}
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            opacity={running ? 0.25 : 0.1}
            style={{
              filter: 'blur(6px)',
              transition: 'stroke-dashoffset 1s linear, opacity 0.6s ease',
            }}
          />

          {/* Main progress arc */}
          <circle
            cx="150" cy="150" r={RADIUS}
            fill="none"
            stroke={strokeColour}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={running ? 'animate-ring-glow' : ''}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />

          {/* Glowing dot at the leading edge of the arc */}
          {remainingFraction > 0.002 && remainingFraction < 0.999 && (
            <>
              {/* Blurred outer glow */}
              <circle
                cx={tip.cx} cy={tip.cy}
                r="12"
                fill={glowColour}
                opacity={running ? 0.55 : 0.3}
                style={{ filter: 'blur(4px)', transition: 'opacity 0.4s' }}
              />
              {/* Bright core dot */}
              <circle
                cx={tip.cx} cy={tip.cy}
                r={running ? 6 : 4}
                fill={strokeColour}
                style={{ transition: 'r 0.4s' }}
              />
            </>
          )}
        </svg>

        {/* Time and status label inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-serif text-5xl font-semibold tabular-nums sm:text-6xl">
            {format(secondsLeft)}
          </span>
          <span className="mt-1.5 text-sm text-brown" aria-live="polite">
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

      {/* Controls */}
      <div className="mt-6 flex gap-3">
        {/* Start / Pause with invite-pulse ring when idle at full time */}
        <div className="relative">
          {showInvitePulse && (
            <span
              aria-hidden="true"
              className="animate-invite-pulse pointer-events-none absolute inset-0 rounded-2xl bg-brown/45"
            />
          )}
          <button
            onClick={handleStartPause}
            disabled={secondsLeft === 0}
            className="relative min-h-[44px] min-w-[88px] rounded-2xl bg-brown px-7 py-2.5 font-medium text-cream shadow-sm transition-all hover:bg-brownDark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? 'Pause' : secondsLeft === 0 ? 'Done ✓' : 'Start'}
          </button>
        </div>
        <button
          onClick={handleReset}
          className="min-h-[44px] min-w-[80px] rounded-2xl bg-brown/10 px-7 py-2.5 font-medium text-brown transition-all hover:bg-brown/20 active:scale-95"
        >
          Reset
        </button>
      </div>

      {/* Focus session leaves */}
      <div className="mt-6 text-center">
        <p className="text-sm text-brown">Focus sessions today</p>
        <div className="mt-1 flex min-h-[30px] flex-wrap items-center justify-center gap-0.5">
          {sessionsToday === 0 ? (
            <span className="text-sm text-brown/60">
              Your first leaf is one session away 🍃
            </span>
          ) : (
            Array.from({ length: sessionsToday }).map((_, i) => (
              <span
                key={i}
                className="animate-leaf-pop text-xl"
                style={{ animationDelay: `${i * 90}ms` }}
                aria-hidden="true"
              >
                🍃
              </span>
            ))
          )}
        </div>
        {sessionsToday > 0 && (
          <span className="sr-only">{sessionsToday} focus sessions completed</span>
        )}
      </div>

      {/* Soot sprite */}
      <div className="relative mt-6 flex h-28 w-full flex-col items-center justify-end">
        <button
          onClick={openQuote}
          aria-label="Open a little note from the soot sprite"
          className={`group relative cursor-pointer rounded-full transition-opacity active:scale-95 ${
            napping ? 'opacity-45' : 'opacity-100'
          } ${hasMail ? 'animate-soot-rise' : 'animate-soot-bob'}`}
        >
          {/* Fuzzy body */}
          <span
            aria-hidden="true"
            className="relative block h-[4.5rem] w-[4.5rem] rounded-full bg-neutral-900"
            style={{ boxShadow: '0 0 10px 4px rgba(0,0,0,0.6)' }}
          >
            {/* Spiky tufts around the body */}
            {[0, 55, 110, 180, 250, 305].map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2 h-3.5 w-2 rounded-full bg-neutral-900"
                style={{
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-30px)`,
                }}
              />
            ))}

            {/* Eyes — open with pupils, or droopy closed lines while napping.
                When awake, blink animation fires every 7s. */}
            <span
              className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-2.5 ${
                !napping ? 'animate-blink' : ''
              }`}
            >
              {napping ? (
                <>
                  <span className="h-[3px] w-3 rounded-full bg-white/85" />
                  <span className="h-[3px] w-3 rounded-full bg-white/85" />
                </>
              ) : (
                <>
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  </span>
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  </span>
                </>
              )}
            </span>
          </span>

          {/* Envelope badge */}
          {hasMail && (
            <span className="absolute -right-3 -top-3 text-3xl" aria-hidden="true">
              ✉️
            </span>
          )}
        </button>

        {/* Squish shadow below the sprite — grows when sprite bobs down, shrinks when up. */}
        <div
          aria-hidden="true"
          className="animate-shadow-squish mt-1 h-2 w-12 rounded-full bg-black/25 blur-sm"
        />
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
