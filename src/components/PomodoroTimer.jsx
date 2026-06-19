import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'
import { SOOT_AWAKE, SOOT_NAP, PAL } from '../pixel/sprites.js'
import { BREAK_ACTIVITIES } from '../data/breakActivities.js'
import { useMixer } from '../audio/AudioMixerProvider.jsx'
import { generate, randomDNA, stageForProgress, witherPalette, STAGES } from '../pixel/PlantGenerator.js'

// Post-session overlays — loaded on demand, not part of the initial bundle.
// LetterModal carries the (large) encouragement library, so it stays out of the
// initial bundle and only loads when Emily opens a letter.
const LetterModal = lazy(() => import('./LetterModal.jsx'))
const ReflectionModal = lazy(() => import('./ReflectionModal.jsx'))

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

/** Widget 2 — The Pomodoro timer (centerpiece, lofi window). */
export default function PomodoroTimer({ onFocusActive, className = '' }) {
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [hasMail, setHasMail] = useState(false)
  const [letterContext, setLetterContext] = useState(null) // null = letter closed
  const pendingContext = useRef(null) // a context "armed" by an event for the next tap
  const [intention, setIntention] = useState('') // "the one thing" (session-scoped)
  const [stats, setStats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [spr] = usePersistedState('emily.spr', { seen: [], lastOpenDay: '' })
  const [, setReflections] = usePersistedState('emily.reflections', [])
  const [, setGarden] = usePersistedState('emily.garden', [])
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionNote, setReflectionNote] = useState('')
  const [breakTip, setBreakTip] = useState(null)
  const [plantDna, setPlantDna] = useState(null) // this session's growing tree
  const [withered, setWithered] = useState(false) // tab-away penalty state
  const penaltyTimer = useRef(null)

  const { rampMaster, restoreMaster } = useMixer()

  const total = DURATIONS[mode]

  useEscapeKey(() => setShowReflection(false), showReflection)

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
      // Harvest the grown tree into the persistent garden.
      if (plantDna != null && !withered) {
        setGarden((prev) => [...prev, { id: plantDna, ts: Date.now() }])
      }
      // Arm the sprite's next letter: celebration normally, but after a few
      // sessions today lean toward rest/peace to counter ADHD hyperfocus.
      // (Reflection mood, chosen next, may refine this to 'rough' / 'breeze'.)
      const sessionsToday = (stats.day === dayStr() ? stats.sessionsToday : 0) + 1
      pendingContext.current = sessionsToday >= 3 ? 'break' : 'complete'
      // Focus Fade: gently duck the soundscape into the break.
      rampMaster(0.1, 10)
    } else {
      // Break ended — restore the user's audio levels.
      restoreMaster(5)
    }
    // recordFocusSession reads the latest stats via the functional updater.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, mode])

  // Tell the app when a focus session is active (drives the visual focus-fade).
  useEffect(() => {
    onFocusActive?.(running && mode === 'focus')
  }, [running, mode, onFocusActive])

  // Gentle tab-away penalty: if the user leaves mid-focus and doesn't return
  // within 10s, the seedling rests and the session pauses (never shaming).
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && running && mode === 'focus') {
        clearTimeout(penaltyTimer.current)
        penaltyTimer.current = setTimeout(() => {
          setRunning(false)
          setWithered(true)
        }, 10000)
      } else {
        clearTimeout(penaltyTimer.current)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(penaltyTimer.current)
    }
  }, [running, mode])

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
    setPlantDna(null)
    setWithered(false)
    setBreakTip(
      next === 'break' ? BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)] : null,
    )
    // Starting a break? Arm a playful/cozy/rest letter for the next tap.
    if (next === 'break') pendingContext.current = 'break'
  }

  function saveReflection(mood) {
    setReflections((prev) => [...prev, { ts: Date.now(), mood, note: reflectionNote.trim() }])
    setReflectionNote('')
    setShowReflection(false)
    // Refine the armed letter context to match how the session felt.
    if (mood === 'rain')
      pendingContext.current = 'rough' // comfort / identity / hope
    else if (mood === 'sun') pendingContext.current = 'breeze' // joy / celebration
    // 'cloud' keeps whatever the completion already armed (celebration / rest).
  }

  function handleStartPause() {
    if (secondsLeft === 0) return
    const starting = !running
    setRunning((r) => !r)
    setHasMail(false)
    if (starting && mode === 'focus') {
      // Plant a fresh seedling when a focus session begins from full.
      if (secondsLeft === total) {
        setPlantDna(randomDNA())
        setWithered(false)
      }
      restoreMaster(2) // ensure audio is back to normal during focus
    }
  }

  function handleReset() {
    setRunning(false)
    setSecondsLeft(DURATIONS[mode])
    setHasMail(false)
    setPlantDna(null)
    setWithered(false)
  }

  // Open the sprite's letter. An event may have "armed" a context (completion,
  // reflection mood, break); otherwise it's the daily letter on the first tap of
  // the day, or a general encouraging mix.
  function openLetter() {
    let ctx = pendingContext.current
    pendingContext.current = null
    if (!ctx) ctx = spr.lastOpenDay !== dayStr() ? 'daily' : 'idle'
    setLetterContext(ctx)
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

  // The session's growing tree (seed → sprout → sapling → mature by progress).
  const elapsedFrac = total > 0 ? (total - secondsLeft) / total : 0
  const stageIdx = secondsLeft === 0 ? 3 : stageForProgress(elapsedFrac)
  // generate() is deterministic and only changes shape with the species/stage —
  // not with every 1s tick — so memoize on those instead of secondsLeft.
  const plant = useMemo(
    () => (mode === 'focus' && plantDna != null ? generate(plantDna, STAGES[stageIdx]) : null),
    [mode, plantDna, stageIdx],
  )
  const plantPalette = useMemo(
    () => (plant && withered ? witherPalette(plant.palette) : plant?.palette),
    [plant, withered],
  )

  return (
    <WindowFrame title="Pomodoro" bodyClass="bg-latte" className={className}>
      <div className="flex flex-col items-center gap-5">
        {/* Mode toggle */}
        <div
          role="group"
          aria-label="Timer mode"
          className="flex gap-1 rounded-full bg-brown/10 p-1 font-display text-sm"
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
              mode === 'break'
                ? 'scale-[1.04] bg-ever-green text-bg0 shadow-sm'
                : 'text-brown hover:bg-brown/10'
            }`}
          >
            Rest · 5
          </button>
        </div>

        {/* Session intention — "the one thing" */}
        {showIntentionInput ? (
          <div className="w-full max-w-xs">
            <label
              htmlFor="intention-input"
              className="mb-1.5 block text-center font-display text-sm text-brown"
            >
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
            <p className="max-w-xs text-center font-display text-sm text-brown" aria-live="polite">
              <span className="text-brown/60">Your one thing:</span> {trimmedIntention}
            </p>
          )
        )}

        {/* Ring */}
        <div className="relative h-56 w-56 sm:h-60 sm:w-60 md:h-72 md:w-72">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 300 300" aria-hidden="true">
            <circle cx="150" cy="150" r={RADIUS} fill="none" stroke="rgba(143,94,54,0.12)" strokeWidth="16" />
            <circle
              cx="150"
              cy="150"
              r={RADIUS}
              fill="none"
              stroke={glowColour}
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              opacity={running ? 0.25 : 0.1}
              style={{ filter: 'blur(6px)', transition: 'stroke-dashoffset 1s linear, opacity 0.6s ease' }}
            />
            <circle
              cx="150"
              cy="150"
              r={RADIUS}
              fill="none"
              stroke={strokeColour}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={running ? 'animate-ring-glow' : ''}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            {remainingFraction > 0.002 && remainingFraction < 0.999 && (
              <>
                <circle
                  cx={tip.cx}
                  cy={tip.cy}
                  r="12"
                  fill={glowColour}
                  opacity={running ? 0.55 : 0.3}
                  style={{ filter: 'blur(4px)', transition: 'opacity 0.4s' }}
                />
                <circle
                  cx={tip.cx}
                  cy={tip.cy}
                  r={running ? 6 : 4}
                  fill={strokeColour}
                  style={{ transition: 'r 0.4s' }}
                />
              </>
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-sans text-6xl font-bold tabular-nums tracking-tight sm:text-6xl md:text-7xl">
              {format(secondsLeft)}
            </span>
            <span className="mt-1.5 text-sm text-brown" aria-live="polite">
              {secondsLeft === 0
                ? mode === 'focus'
                  ? 'Session done.'
                  : "Break's over."
                : running
                  ? mode === 'focus'
                    ? 'In focus.'
                    : 'Resting.'
                  : mode === 'focus'
                    ? 'Ready when you are.'
                    : 'Time for a break.'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 font-display">
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
              className="relative min-h-[44px] min-w-[96px] rounded-2xl bg-brown px-6 py-2.5 text-cream shadow-sm transition-all hover:bg-brownDark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? 'Pause' : secondsLeft === 0 ? 'Done ✓' : 'Start'}
            </button>
          </div>
          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[96px] rounded-2xl bg-brown/10 px-6 py-2.5 text-brown transition-all hover:bg-brown/20 active:scale-95"
          >
            Reset
          </button>
        </div>

        {/* Focus Garden — a seedling that grows with the session */}
        {plant && (
          <div className="flex flex-col items-center" aria-live="polite">
            <PixelSprite
              key={withered ? 'withered' : stageIdx}
              grid={plant.grid}
              palette={plantPalette}
              pixel={5}
              className={withered ? 'animate-wither' : 'animate-pixel-pop'}
            />
            <p className="mt-2 max-w-xs text-center text-xs text-brown/70">
              {withered
                ? "This seedling's on pause. Hit reset to start a new one whenever you're ready."
                : stageIdx === 0
                  ? 'Seed planted.'
                  : stageIdx === 1
                    ? 'Sprouting.'
                    : stageIdx === 2
                      ? 'Coming along.'
                      : 'Grown. Into the garden it goes.'}
            </p>
          </div>
        )}

        {/* Break micro-activity */}
        {mode === 'break' && breakTip && (
          <div
            className="w-full max-w-xs rounded-2xl bg-ever-green/15 px-4 py-3 text-center text-sm text-brown"
            aria-live="polite"
          >
            <span className="font-display text-brown/70">Try this:</span>
            <br />
            {breakTip}
          </div>
        )}

        {/* Pixel soot sprite companion */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative flex h-20 w-full flex-col items-center justify-end">
            <button
              onClick={openLetter}
              aria-label="Open a letter from the sprite"
              className={`group relative cursor-pointer transition-opacity active:scale-95 ${
                napping ? 'opacity-50' : 'opacity-100'
              } ${hasMail ? 'animate-soot-rise' : 'animate-soot-bob'}`}
            >
              <PixelSprite grid={napping ? SOOT_NAP : SOOT_AWAKE} palette={PAL} pixel={5} />
              {hasMail && (
                <span className="absolute -right-3 -top-3 text-3xl" aria-hidden="true">
                  ✉️
                </span>
              )}
            </button>

            {/* Squish shadow */}
            <div
              aria-hidden="true"
              className="animate-shadow-squish mt-1 h-2 w-12 rounded-full bg-black/25 blur-sm"
            />
          </div>

          <p className="text-center text-xs text-brown/70">
            {hasMail
              ? 'Tap the sprite. It wrote you a letter.'
              : napping
                ? "The sprite's napping while you focus."
                : 'Tap the sprite for a letter.'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        {letterContext && <LetterModal context={letterContext} onClose={() => setLetterContext(null)} />}
        {justFinishedFocus && showReflection && (
          <ReflectionModal
            note={reflectionNote}
            onNoteChange={setReflectionNote}
            onSaveMood={saveReflection}
            intention={trimmedIntention}
            onClearIntention={() => setIntention('')}
            onClose={() => setShowReflection(false)}
          />
        )}
      </Suspense>
    </WindowFrame>
  )
}
