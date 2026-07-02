import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'
import { SOOT_AWAKE, SOOT_NAP, PAL, LANTERN } from '../pixel/sprites.js'
import CompanionMenu from './CompanionMenu.jsx'
import GroveWindow from './GroveWindow.jsx'
import DialogueBox from '../ui/jrpg/DialogueBox.jsx'
import { BREAK_ACTIVITIES } from '../data/breakActivities.js'
import { useMixer } from '../audio/AudioMixerProvider.jsx'
import { generate, witherPalette, STAGES } from '../pixel/PlantGenerator.js'
import { sessionSeed, growthStageForProgress, growthLabel } from '../data/treeGrowth.js'
import { bloom, bloomLabel } from '../data/sessionBloom.js'
import { companionLine } from '../data/companionLine.js'
import useUiSound from '../hooks/useUiSound.js'
import { endsAtFrom, remainingSeconds, formatClock } from '../utils/timer.js'
import { dayStr, yesterdayStr } from '../utils/day.js'
import { recordSession } from '../data/focusLog.js'

// Post-session overlays — loaded on demand, not part of the initial bundle.
// LetterModal carries the (large) encouragement library, so it stays out of the
// initial bundle and only loads when Emily opens a letter.
const LetterModal = lazy(() => import('./LetterModal.jsx'))
const ReflectionModal = lazy(() => import('./ReflectionModal.jsx'))
const HarvestCeremony = lazy(() => import('./HarvestCeremony.jsx'))

// Focus length is chosen by Emily so the session can fit the task (a small
// challenge-skill / planning aid). 25 stays the default; the break is fixed at 5.
// Note: the 25/5 split is a convention, not settled science — hence the choice.
const FOCUS_CHOICES = [15, 25, 45]
const DEFAULT_FOCUS_MIN = 25
const BREAK_MIN = 5

const RADIUS = 130
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }

function tipCoords(fraction) {
  const angle = fraction * 2 * Math.PI
  return { cx: 150 + RADIUS * Math.cos(angle), cy: 150 + RADIUS * Math.sin(angle) }
}

/** Widget 2 — The Pomodoro timer (centerpiece, lofi window). */
export default function PomodoroTimer({
  onFocusActive,
  reviewDue = 0,
  onReviewCards,
  onOpenGrove,
  onOpenWeek,
  onSetName,
  partOfDay = 'day',
  companionName = null,
  className = '',
}) {
  const [timer, setTimer] = usePersistedState('emily.timer', { focusMin: DEFAULT_FOCUS_MIN })
  const focusMin = FOCUS_CHOICES.includes(timer?.focusMin) ? timer.focusMin : DEFAULT_FOCUS_MIN
  const durations = useMemo(() => ({ focus: focusMin * 60, break: BREAK_MIN * 60 }), [focusMin])
  const [mode, setMode] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(durations.focus)
  const [running, setRunning] = useState(false)
  const [hasMail, setHasMail] = useState(false)
  const [companionOpen, setCompanionOpen] = useState(false) // overworld "talk" panel
  const [letterContext, setLetterContext] = useState(null) // null = letter closed
  const pendingContext = useRef(null) // a context "armed" by an event for the next tap
  const [intention, setIntention] = useState('') // "the one thing" (session-scoped)
  const [stats, setStats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [spr] = usePersistedState('emily.spr', { seen: [], lastOpenDay: '' })
  const [, setReflections] = usePersistedState('emily.reflections', [])
  const [, setGarden] = usePersistedState('emily.garden', [])
  const [, setFocusLog] = usePersistedState('emily.focusLog', {})
  const [showReflection, setShowReflection] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false) // the harvest moment
  const [welcomeBack, setWelcomeBack] = useState(false) // resumed after a wither pause
  const [reflectionNote, setReflectionNote] = useState('')
  const [breakTip, setBreakTip] = useState(null)
  const [plantDna, setPlantDna] = useState(null) // this session's growing tree
  const [withered, setWithered] = useState(false) // tab-away penalty state
  // A varietal queued from the Grove Almanac's "Grow this one next" (else random).
  const [grove, setGrove] = usePersistedState('emily.grove', { unlocked: {}, plantNext: null })
  const penaltyTimer = useRef(null)
  const endsAtRef = useRef(null) // wall-clock deadline while running (timestamp-based)
  const plantNextUsedRef = useRef(null) // the queued varietal this session grew, if any
  const lastStageRef = useRef(0) // last announced/played growth stage (avoids re-firing)

  const { rampMaster, restoreMaster, setSessionPhase, playResolutionMotif } = useMixer()
  const playUi = useUiSound()

  const total = durations[mode]

  useEscapeKey(() => setShowReflection(false), showReflection)

  // Timestamp-based countdown: while running we hold a wall-clock deadline and
  // recompute the remaining seconds from Date.now() — on each tick and whenever
  // the tab becomes visible again — so a throttled/backgrounded tab can't drift.
  useEffect(() => {
    if (!running) {
      endsAtRef.current = null
      return undefined
    }
    // Anchor the deadline to the seconds remaining when the run (re)started.
    endsAtRef.current = endsAtFrom(secondsLeft)
    const tick = () => setSecondsLeft(remainingSeconds(endsAtRef.current))
    const id = setInterval(tick, 250)
    const onVisible = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
    // secondsLeft is intentionally read only at (re)start to anchor the deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => {
    if (secondsLeft !== 0 || !running) return
    setRunning(false)
    setHasMail(true)
    if (mode === 'focus') {
      recordFocusSession()
      // One timestamp shared by the garden + the Firefly Calendar so they stay
      // consistent for the same completed session.
      const ts = Date.now()
      // Harvest the grown tree into the persistent garden. A real harvest opens the
      // Harvest Ceremony (which hands off into the reflection); a session that
      // finished withered skips straight to the reflection, with no loss language.
      if (plantDna != null && !withered) {
        setGarden((prev) => [...prev, { id: plantDna, ts }])
        // Spend a queued varietal only now, on a real harvest, and only if it is
        // still the one this session grew (guards a varietal re-queued mid-session).
        const used = plantNextUsedRef.current
        if (used != null) {
          setGrove((g) => (g.plantNext === used ? { ...g, plantNext: null } : g))
          plantNextUsedRef.current = null
        }
        setShowCeremony(true)
        // One short original phrase, only on a real harvest — never on a withered ending.
        playResolutionMotif()
      } else {
        setShowReflection(true)
      }
      // Log this completed focus session to the Firefly Calendar time-series with
      // its real focus length. Breaks never reach this branch, so they never log.
      setFocusLog((prev) => recordSession(prev, { ts, minutes: focusMin }))
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
      const minutesToday = (freshDay ? 0 : prev.minutesToday) + focusMin
      let streak = prev.streak || 0
      if (prev.lastStudyDay !== td) {
        streak = prev.lastStudyDay === yesterdayStr() ? streak + 1 : 1
      }
      return { day: td, sessionsToday, minutesToday, streak, lastStudyDay: td }
    })
  }

  function switchMode(next) {
    setMode(next)
    setSecondsLeft(durations[next])
    setRunning(false)
    setHasMail(false)
    setShowReflection(false)
    setShowCeremony(false)
    setWelcomeBack(false)
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
      // Plant a fresh seedling when a focus session begins from full. Its DNA is the
      // varietal queued from the Almanac if any, otherwise derived deterministically
      // from the start time, so the tree she watches grow is the one that harvests.
      // plantNext is NOT consumed here: it is spent only on a successful harvest, so
      // an abandoned session never burns it.
      if (secondsLeft === total) {
        const queued = grove?.plantNext ?? null
        plantNextUsedRef.current = queued
        lastStageRef.current = 0
        setPlantDna(sessionSeed({ startTs: Date.now(), plantNext: queued }))
        setWithered(false)
      } else if (withered) {
        // Resuming mid-session after a wither pause: the seedling wakes back up
        // (it was stuck resting forever otherwise), and the companion offers one
        // warm line acknowledging her return, never how long she was gone.
        setWithered(false)
        setWelcomeBack(true)
      }
      restoreMaster(2) // ensure audio is back to normal during focus
    }
  }

  function handleReset() {
    setRunning(false)
    setSecondsLeft(durations[mode])
    setHasMail(false)
    setPlantDna(null)
    setWithered(false)
    setWelcomeBack(false)
  }

  // Choose how long this kind of work wants to be (only while idle in focus).
  function setFocusLength(n) {
    setTimer((t) => ({ ...(t || {}), focusMin: n }))
    if (mode === 'focus' && !sessionActive) {
      setRunning(false)
      setSecondsLeft(n * 60)
    }
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
  const stageIdx = secondsLeft === 0 ? 3 : growthStageForProgress(elapsedFrac)
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

  // A soft blip when the tree reaches a new growth stage during an active run.
  // Subtle and additive: safe no-op until audio is enabled, and never on the initial
  // seed (lastStageRef starts at 0 and is reset to 0 at each fresh start).
  useEffect(() => {
    if (mode === 'focus' && plantDna != null && running && stageIdx > lastStageRef.current) {
      playUi('confirm')
    }
    lastStageRef.current = stageIdx
  }, [stageIdx, running, mode, plantDna, playUi])

  // The scene's accretion state. secondsLeft only changes once per real second, so
  // this recomputes (and the scene re-renders) at most 1/sec, within the perf budget.
  const bloomState = useMemo(() => bloom(elapsedFrac, { durationSec: total }), [elapsedFrac, total])
  const sceneLive = mode === 'focus' && plantDna != null

  // Let the score breathe with the session arc: the accompaniment blooms in as
  // the scene escalates (setSessionPhase itself no-ops when the phase repeats).
  useEffect(() => {
    setSessionPhase(sceneLive && !withered ? bloomState.phase : null)
  }, [sceneLive, withered, bloomState.phase, setSessionPhase])

  // A tiny lit lantern appears beside the companion for the golden minute, whether
  // it is awake or napping through the run, a small warm cue nothing else conveys.
  const showLantern = sceneLive && !withered && (bloomState.phase === 'golden' || bloomState.phase === 'done')

  // Calm idle poses, keyed to the real part of day, only while genuinely idle
  // (napping keeps its own sleeping grid; a waiting letter keeps its own rise).
  const poseClass = napping
    ? 'animate-soot-bob'
    : hasMail
      ? 'animate-soot-rise'
      : partOfDay === 'night'
        ? 'animate-soot-doze'
        : partOfDay === 'dawn' || partOfDay === 'day'
          ? 'animate-soot-look'
          : 'animate-soot-bob' // dusk keeps the calm default

  // THE one polite live region for the whole card. Priority order: completion, then
  // the break, then the wither pause, then growth + scene milestones, then timer
  // state. Text only changes at meaningful moments, so nothing chatters per second.
  const announcement = (() => {
    if (secondsLeft === 0) return mode === 'focus' ? `Session done. ${growthLabel(3)}` : "Break's over."
    if (mode === 'break') return breakTip ? `Resting. Try this: ${breakTip}` : 'Time for a break.'
    if (withered) return 'The seedling is resting for now.'
    if (sceneLive) return `${growthLabel(stageIdx)} ${bloomLabel(bloomState.phase)}`
    return running ? 'In focus.' : 'Ready when you are.'
  })()

  return (
    <WindowFrame title="Pomodoro" bodyClass="bg-latte" className={className}>
      <div className="flex flex-col items-center gap-5">
        {/* The card's single consolidated live region (visible status lines below
            are aria-hidden so screen readers hear one kind announcement, on change). */}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

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
            Focus · {focusMin}
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
            Rest · {BREAK_MIN}
          </button>
        </div>

        {/* Focus length — let the session fit the task (only while idle in focus) */}
        {mode === 'focus' && (
          <div role="group" aria-label="Focus length in minutes" className="flex items-center gap-2">
            <span className="font-display text-xs text-brown/60">Length</span>
            <div className="flex gap-1 rounded-full bg-brown/10 p-1 font-display text-xs">
              {FOCUS_CHOICES.map((n) => (
                <button
                  key={n}
                  onClick={() => setFocusLength(n)}
                  disabled={sessionActive}
                  aria-pressed={focusMin === n}
                  aria-label={`${n} minute focus`}
                  className={`rounded-full px-3 py-1 transition-colors disabled:opacity-40 ${
                    focusMin === n ? 'bg-brown text-cream' : 'text-brown hover:bg-brown/15'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Session intention as an implementation intention ("when I start, I will…"):
            naming the concrete first action makes task initiation easier. Once the
            session is underway it is pinned as a small sign inside the Grove Window
            scene instead of floating here above the ring. */}
        {showIntentionInput && (
          <div className="w-full max-w-xs">
            <label
              htmlFor="intention-input"
              className="mb-1.5 block text-center font-display text-sm text-brown"
            >
              When I start, I will&hellip;
            </label>
            <input
              id="intention-input"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="open the chapter and read one page&hellip;"
              className="w-full rounded-xl border-2 border-brown/20 bg-white/70 px-3 py-2 text-center text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
            />
          </div>
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
              {formatClock(secondsLeft)}
            </span>
            <span className="mt-1.5 text-sm text-brown" aria-hidden="true">
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

        {/* The Grove Window — the card's living diorama. The session tree and the
            companion inhabit one scene whose sky follows the real part of day and
            whose weather follows the ambient mixer. */}
        {/* Fireflies and warmth freeze with the clock during any pause (including
            the wither rest) and never regress: nothing earned in a session leaves. */}
        <GroveWindow
          partOfDay={partOfDay}
          phase={sceneLive ? bloomState.phase : null}
          fireflies={sceneLive ? bloomState.fireflies : 0}
          warmth={sceneLive ? bloomState.lightWarmth : 0}
          intention={sceneLive && trimmedIntention ? trimmedIntention : null}
          className="h-40 w-full"
        >
          {plant && (
            /* Generator grids are 2x dense (Renderer 2.0): 2.5 keeps the tree the
               same physical size it has always been. */
            <PixelSprite
              key={withered ? 'withered' : stageIdx}
              grid={plant.grid}
              palette={plantPalette}
              pixel={2.5}
              className={withered ? 'animate-wither' : 'animate-pixel-pop'}
            />
          )}

          {/* Pixel soot sprite companion — tap to talk (the overworld NPC). It naps
              during a focus run, so it is only conversational while you are free. */}
          <div className="relative flex flex-col items-center justify-end">
            <button
              onClick={napping ? undefined : () => setCompanionOpen(true)}
              disabled={napping}
              aria-label={
                napping ? `The sprite is napping while you focus` : `Talk to ${companionName || 'the sprite'}`
              }
              className={`group relative transition-opacity active:scale-95 disabled:cursor-default ${
                napping ? 'opacity-50' : 'cursor-pointer opacity-100'
              } ${poseClass}`}
            >
              <PixelSprite grid={napping ? SOOT_NAP : SOOT_AWAKE} palette={PAL} pixel={5} />
              {hasMail && (
                <span className="absolute -right-3 -top-3 text-3xl" aria-hidden="true">
                  ✉️
                </span>
              )}
              {showLantern && (
                <div
                  aria-hidden="true"
                  className="animate-lantern-flicker absolute -right-4 bottom-2"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,210,125,0.85))' }}
                >
                  <PixelSprite grid={LANTERN} palette={PAL} pixel={4} />
                </div>
              )}
            </button>

            {/* Squish shadow */}
            <div
              aria-hidden="true"
              className="animate-shadow-squish mt-1 h-2 w-12 rounded-full bg-black/25 blur-sm"
            />
          </div>
        </GroveWindow>

        {/* A quiet welcome back after a wither pause: the companion's own small,
            dismissible toast (mirrors SpriteGreeting elsewhere), never trapping
            focus and never mentioning how long she was gone. */}
        {welcomeBack && (
          <div role="status" aria-live="polite" className="relative w-full max-w-xs">
            <DialogueBox
              name={companionName || 'your soot friend'}
              text={companionLine({ welcomeBack: true, companionName, seed: plantDna ?? 0 })}
              live={false}
              className="pr-9"
            />
            <button
              onClick={() => setWelcomeBack(false)}
              aria-label="Dismiss welcome back"
              className="absolute right-1.5 top-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-md text-jrpg-text/80 transition-colors hover:text-jrpg-text focus-visible:ring-2 focus-visible:ring-ever-yellow"
            >
              ✕
            </button>
          </div>
        )}

        {/* Captions live below the scene, on the card surface, so text contrast
            never depends on the sky. */}
        {plant && (
          /* Visible caption (sighted only); the card's consolidated live region
             carries the equivalent announcement, once, on change. */
          <p aria-hidden="true" className="-mt-2 max-w-xs text-center text-xs text-brown/70">
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
        )}

        {/* Break micro-activity (announced by the consolidated region above) */}
        {mode === 'break' && breakTip && (
          <div className="w-full max-w-xs rounded-2xl bg-ever-green/15 px-4 py-3 text-center text-sm text-brown">
            <span className="font-display text-brown/70">Try this:</span>
            <br />
            {breakTip}
          </div>
        )}

        <p className="-mt-2 text-center text-xs text-brown/70">
          {hasMail
            ? 'Tap the sprite. It wrote you a letter.'
            : napping
              ? "The sprite's napping while you focus."
              : 'Tap the sprite to say hello.'}
        </p>
      </div>

      {companionOpen && (
        <CompanionMenu
          companionName={companionName}
          dueCount={reviewDue}
          hasMail={hasMail}
          running={running}
          partOfDay={partOfDay}
          onReadLetter={openLetter}
          onStartFocus={() => {
            if (!running && mode === 'focus') handleStartPause()
          }}
          onReviewCards={onReviewCards}
          onOpenGrove={onOpenGrove}
          onOpenWeek={onOpenWeek}
          onSetName={onSetName}
          onClose={() => setCompanionOpen(false)}
        />
      )}

      <Suspense fallback={null}>
        {letterContext && <LetterModal context={letterContext} onClose={() => setLetterContext(null)} />}
        {/* The harvest moment: one short skippable ceremony, then the reflection. */}
        {showCeremony && plant && (
          <HarvestCeremony
            plant={plant}
            intention={trimmedIntention}
            companionName={companionName}
            onDone={() => {
              setShowCeremony(false)
              setShowReflection(true)
            }}
          />
        )}
        {justFinishedFocus && showReflection && (
          <ReflectionModal
            note={reflectionNote}
            onNoteChange={setReflectionNote}
            onSaveMood={saveReflection}
            intention={trimmedIntention}
            onClearIntention={() => setIntention('')}
            reviewDue={reviewDue}
            onReviewCards={
              onReviewCards
                ? () => {
                    setShowReflection(false)
                    onReviewCards()
                  }
                : undefined
            }
            onClose={() => setShowReflection(false)}
          />
        )}
      </Suspense>
    </WindowFrame>
  )
}
