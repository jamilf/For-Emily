import { useEffect, useState } from 'react'
import QuoteModal from './QuoteModal.jsx'
import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'
import { SOOT_AWAKE, SOOT_NAP, PAL } from '../pixel/sprites.js'
import { QUOTES } from '../data/quotes.js'
import { BREAK_ACTIVITIES } from '../data/breakActivities.js'

const DURATIONS = { focus: 25 * 60, break: 5 * 60 }
const FOCUS_MINUTES = DURATIONS.focus / 60

const RADIUS = 130
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }

function dayStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayStr(d)
}

function format(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function tipCoords(fraction) {
  const angle = fraction * 2 * Math.PI
  return { cx: 150 + RADIUS * Math.cos(angle), cy: 150 + RADIUS * Math.sin(angle) }
}

/** Widget 2 — The Spirited Pomodoro (centerpiece, lofi window). */
export default function PomodoroTimer() {
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [hasMail, setHasMail] = useState(false)
  const [quote, setQuote] = useState(null)
  const [intention, setIntention] = useState('') // "the one thing" (session-scoped)
  const [parked, setParked] = usePersistedState('emily.parkingLot', [])
  const [stats, setStats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [reflections, setReflections] = usePersistedState('emily.reflections', [])
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionNote, setReflectionNote] = useState('')
  const [breakTip, setBreakTip] = useState(null)

  const total = DURATIONS[mode]

  useEscapeKey(() => setShowReflection(false), showReflection)

  // Today's progress (stale stats from a previous day read as zero until updated).
  const today = dayStr()
  const sessionsToday = stats.day === today ? stats.sessionsToday : 0
  const minutesToday = stats.day === today ? stats.minutesToday : 0

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return
    setRunning(false)
    setHasMail(true)
    if (mode === 'focus') {
      recordFocusSession()
      setShowReflection(true)
    }
    // recordFocusSession reads the latest stats via the functional updater.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, mode])

  // Record one completed focus session: minutes, sessions, and a kind streak
  // (a missed day quietly restarts the streak — it is never framed as broken).
  function recordFocusSession() {
    setStats((prev) => {
      const td = dayStr()
      const freshDay = prev.day !== td
      const sessionsToday = (freshDay ? 0 : prev.sessionsToday) + 1
      const minutesToday = (freshDay ? 0 : prev.minutesToday) + FOCUS_MINUTES
      let streak = prev.streak || 0
      if (prev.lastStudyDay !== td) {
        streak = prev.lastStudyDay === yesterdayStr() ? streak + 1 : 1
      }
      return { day: td, sessionsToday, minutesToday, streak, lastStudyDay: td }
    })
  }

  function switchMode(next) {
    setMode(next)
    setSecondsLeft(DURATIONS[next])
    setRunning(false)
    setHasMail(false)
    setShowReflection(false)
    setBreakTip(next === 'break' ? BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)] : null)
  }

  function saveReflection(mood) {
    setReflections((prev) => [...prev, { ts: Date.now(), mood, note: reflectionNote.trim() }])
    setReflectionNote('')
    setShowReflection(false)
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
  const glowColour = mode === 'focus' ? '#DBBC7F' : '#83C092'
  const showInvitePulse = !running && secondsLeft === total
  const tip = tipCoords(remainingFraction)

  // Session intention: editable while idle, pinned once the session is underway.
  const sessionActive = running || secondsLeft < total
  const showIntentionInput = mode === 'focus' && !sessionActive
  const trimmedIntention = intention.trim()
  const justFinishedFocus = mode === 'focus' && secondsLeft === 0

  return (
    <WindowFrame title="Spirited Pomodoro" bodyClass="bg-latte">
      <div className="flex flex-col items-center">
        {/* Mode toggle */}
        <div
          role="group"
          aria-label="Timer mode"
          className="mb-6 flex gap-1 rounded-full bg-brown/10 p-1 font-display text-sm"
        >
          <button
            onClick={() => switchMode('focus')}
            aria-pressed={mode === 'focus'}
            className={`rounded-full px-5 py-1.5 transition-all duration-200 ${
              mode === 'focus' ? 'scale-[1.04] bg-brown text-cream shadow-sm' : 'text-brown hover:bg-brown/10'
            }`}
          >
            Focus · 25
          </button>
          <button
            onClick={() => switchMode('break')}
            aria-pressed={mode === 'break'}
            className={`rounded-full px-5 py-1.5 transition-all duration-200 ${
              mode === 'break' ? 'scale-[1.04] bg-ever-green text-bg0 shadow-sm' : 'text-brown hover:bg-brown/10'
            }`}
          >
            Rest · 5
          </button>
        </div>

        {/* Session intention — "the one thing" */}
        {showIntentionInput ? (
          <div className="mb-5 w-full max-w-xs">
            <label htmlFor="intention-input" className="mb-1.5 block text-center font-display text-sm text-brown">
              What&apos;s the one thing?
            </label>
            <input
              id="intention-input"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. read one chapter…"
              className="w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-center text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
            />
          </div>
        ) : (
          mode === 'focus' &&
          trimmedIntention && (
            <p className="mb-5 max-w-xs text-center font-display text-sm text-brown" aria-live="polite">
              <span className="text-brown/60">Your one thing:</span> {trimmedIntention}
            </p>
          )
        )}

        {/* Ring */}
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 300 300" aria-hidden="true">
            <circle cx="150" cy="150" r={RADIUS} fill="none" stroke="rgba(143,94,54,0.12)" strokeWidth="16" />
            <circle
              cx="150" cy="150" r={RADIUS} fill="none"
              stroke={glowColour} strokeWidth="22" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              opacity={running ? 0.25 : 0.1}
              style={{ filter: 'blur(6px)', transition: 'stroke-dashoffset 1s linear, opacity 0.6s ease' }}
            />
            <circle
              cx="150" cy="150" r={RADIUS} fill="none"
              stroke={strokeColour} strokeWidth="16" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              className={running ? 'animate-ring-glow' : ''}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            {remainingFraction > 0.002 && remainingFraction < 0.999 && (
              <>
                <circle cx={tip.cx} cy={tip.cy} r="12" fill={glowColour} opacity={running ? 0.55 : 0.3}
                  style={{ filter: 'blur(4px)', transition: 'opacity 0.4s' }} />
                <circle cx={tip.cx} cy={tip.cy} r={running ? 6 : 4} fill={strokeColour} style={{ transition: 'r 0.4s' }} />
              </>
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-5xl font-semibold tabular-nums sm:text-6xl">
              {format(secondsLeft)}
            </span>
            <span className="mt-1.5 text-sm text-brown" aria-live="polite">
              {secondsLeft === 0
                ? mode === 'focus' ? 'Beautiful work 💌' : 'Welcome back 🌿'
                : running
                  ? mode === 'focus' ? 'Settling in… 🌙' : 'Resting gently…'
                  : mode === 'focus' ? 'Ready when you are' : 'A little rest is earned'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-3 font-display">
          <div className="relative">
            {showInvitePulse && (
              <span aria-hidden="true" className="animate-invite-pulse pointer-events-none absolute inset-0 rounded-2xl bg-brown/45" />
            )}
            <button
              onClick={handleStartPause}
              disabled={secondsLeft === 0}
              className="relative min-h-[44px] min-w-[88px] rounded-2xl bg-brown px-7 py-2.5 text-cream shadow-sm transition-all hover:bg-brownDark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? 'Pause' : secondsLeft === 0 ? 'Done ✓' : 'Start'}
            </button>
          </div>
          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[80px] rounded-2xl bg-brown/10 px-7 py-2.5 text-brown transition-all hover:bg-brown/20 active:scale-95"
          >
            Reset
          </button>
        </div>

        {/* Break micro-activity */}
        {mode === 'break' && breakTip && (
          <div className="mt-5 w-full max-w-xs rounded-2xl bg-ever-green/15 px-4 py-3 text-center text-sm text-brown" aria-live="polite">
            <span className="font-display text-brown/70">A little restoration:</span>
            <br />
            {breakTip}
          </div>
        )}

        {/* Focus leaves + minutes + a kind streak */}
        <div className="mt-6 text-center">
          <p className="font-display text-sm text-brown">Focus sessions today</p>
          <div className="mt-1 flex min-h-[30px] flex-wrap items-center justify-center gap-0.5">
            {sessionsToday === 0 ? (
              <span className="text-sm text-brown/60">Your first leaf is one session away 🍃</span>
            ) : (
              Array.from({ length: sessionsToday }).map((_, i) => (
                <span key={i} className="animate-leaf-pop text-xl" style={{ animationDelay: `${i * 90}ms` }} aria-hidden="true">
                  🍃
                </span>
              ))
            )}
          </div>
          <p className="mt-1 text-xs text-brown/70" aria-live="polite">
            {sessionsToday > 0 && (
              <span className="sr-only">{sessionsToday} focus sessions, </span>
            )}
            {minutesToday > 0 ? `${minutesToday} min focused today` : 'Every minute counts'}
            {stats.streak > 0 && ` · ${stats.streak} day${stats.streak === 1 ? '' : 's'} tended 🌱`}
          </p>
        </div>

        {/* Pixel soot sprite */}
        <div className="relative mt-6 flex h-28 w-full flex-col items-center justify-end">
          <button
            onClick={openQuote}
            aria-label="Open a little note from the soot sprite"
            className={`group relative cursor-pointer transition-opacity active:scale-95 ${
              napping ? 'opacity-50' : 'opacity-100'
            } ${hasMail ? 'animate-soot-rise' : 'animate-soot-bob'}`}
          >
            <PixelSprite grid={napping ? SOOT_NAP : SOOT_AWAKE} palette={PAL} pixel={5} />
            {hasMail && (
              <span className="absolute -right-3 -top-3 text-3xl" aria-hidden="true">✉️</span>
            )}
          </button>

          {/* Squish shadow */}
          <div aria-hidden="true" className="animate-shadow-squish mt-1 h-2 w-12 rounded-full bg-black/25 blur-sm" />
        </div>

        <p className="mt-2 text-center text-xs text-brown/70">
          {hasMail
            ? 'Tap the soot sprite — it brought you a note.'
            : napping
              ? 'Shh… the soot sprite is napping while you focus.'
              : 'Tap the soot sprite for a little encouragement.'}
        </p>

        {/* End-of-session reflection check-in */}
        {justFinishedFocus && showReflection && (
          <div className="mt-4 w-full max-w-xs rounded-2xl bg-white/60 p-4 text-center">
            <p className="font-display text-sm text-brown">How did that feel?</p>
            <div className="mt-2 flex justify-center gap-3" role="group" aria-label="Reflect on this session">
              {[
                { mood: 'rain', icon: '🌧️', label: 'Tough' },
                { mood: 'cloud', icon: '🌤️', label: 'Okay' },
                { mood: 'sun', icon: '☀️', label: 'Great' },
              ].map((m) => (
                <button
                  key={m.mood}
                  onClick={() => saveReflection(m.mood)}
                  aria-label={m.label}
                  className="rounded-2xl bg-brown/5 px-3 py-2 text-2xl transition-all hover:bg-brown/15 active:scale-95"
                >
                  {m.icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="A note, if you like…"
              className="mt-3 w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
            />
            <button
              onClick={() => setShowReflection(false)}
              className="mt-2 font-display text-xs text-brown/60 underline-offset-2 hover:underline"
            >
              Maybe later
            </button>
          </div>
        )}

        {/* Session wrap-up: parked thoughts + clear the one thing */}
        {justFinishedFocus && (parked.length > 0 || trimmedIntention) && (
          <div className="mt-4 w-full max-w-xs space-y-2 rounded-2xl bg-white/50 p-3 text-center text-sm">
            {parked.length > 0 && (
              <div>
                <p className="text-brown">
                  You parked {parked.length} thing{parked.length === 1 ? '' : 's'} while you focused.
                </p>
                <button
                  onClick={() => setParked([])}
                  className="mt-1 rounded-full bg-brown/10 px-4 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Clear the parking lot
                </button>
              </div>
            )}
            {trimmedIntention && (
              <button
                onClick={() => setIntention('')}
                className="rounded-full bg-brown/10 px-4 py-1.5 font-display text-xs text-brown transition-colors hover:bg-brown/20 active:scale-95"
              >
                Clear “{trimmedIntention.length > 24 ? trimmedIntention.slice(0, 24) + '…' : trimmedIntention}”
              </button>
            )}
          </div>
        )}
      </div>

      {quote && <QuoteModal quote={quote} onClose={() => setQuote(null)} />}
    </WindowFrame>
  )
}
