import { useEffect, useMemo } from 'react'
import usePersistedState from './useLocalStorage.js'
import useTimeOfDay from './useTimeOfDay.js'
import {
  RETURN,
  buildComeback,
  classifyReturn,
  cleanName,
  cleanNote,
  comebackDayKey,
  dailySeed,
  dayGap,
  deriveCurrentChapter,
  earnedLetters,
  greetingFacts,
  nextChapter,
  pickGreeting,
  storyMetrics,
  unlockedChapters,
} from '../data/story.js'

const EMPTY_STORY = {
  lastSeen: 0,
  seenBeats: {},
  ackChapters: {},
  comebackShown: {},
  companionName: null,
  notes: {},
  letterAcks: {},
}
const EMPTY_STATS = { day: '', minutesToday: 0, sessionsToday: 0, streak: 0, lastStudyDay: null }

/**
 * useStory — the single seam between the persisted stores and the Grove Story UI.
 * Reads the metrics the story derives from (all already stored), snapshots the
 * PRIOR `lastSeen` on first render so the return type / greeting / comeback reflect
 * the real gap, then stamps `lastSeen = now` exactly once. Everything it returns is
 * derived; only the small ack state (chapter acks, comeback-shown, lastSeen) is
 * written back. No new currency, no streak penalty, no nagging.
 */
export default function useStory() {
  const [garden] = usePersistedState('emily.garden', [])
  const [spirits] = usePersistedState('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [focusLog] = usePersistedState('emily.focusLog', {})
  const [story, setStory] = usePersistedState('emily.story', EMPTY_STORY)
  const partOfDay = useTimeOfDay()
  const companionName = story.companionName || null

  // Snapshot the prior visit + the open moment ONCE, so later state writes (e.g.
  // stamping lastSeen, acking a chapter) never change how this return is classified.
  // Intentionally captured a single time (empty deps), like the Firefly Calendar's
  // stable "today" — the snapshot must not move when story state updates.
  const { prevLastSeen, now } = useMemo(
    () => ({ prevLastSeen: story.lastSeen || 0, now: new Date().getTime() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const metrics = useMemo(
    () => storyMetrics({ garden, spirits, stats, flashcardStats, reflections, focusLog }),
    [garden, spirits, stats, flashcardStats, reflections, focusLog],
  )
  const currentChapter = useMemo(() => deriveCurrentChapter(metrics), [metrics])
  const nextLocked = useMemo(() => nextChapter(metrics), [metrics])
  const unlocked = useMemo(() => unlockedChapters(metrics), [metrics])
  const letters = useMemo(() => earnedLetters(metrics), [metrics])

  const returnType = useMemo(() => classifyReturn(prevLastSeen, now), [prevLastSeen, now])
  const seed = useMemo(() => dailySeed(prevLastSeen, now), [prevLastSeen, now])
  const facts = useMemo(
    () =>
      greetingFacts({
        garden,
        spirits,
        focusLog,
        chapter: currentChapter,
        companion: companionName,
        partOfDay,
        now,
      }),
    [garden, spirits, focusLog, currentChapter, companionName, partOfDay, now],
  )
  const greeting = useMemo(() => pickGreeting(facts, returnType, seed), [facts, returnType, seed])

  const dayKey = comebackDayKey(now)
  const comeback = useMemo(() => {
    if (returnType !== RETURN.LONG) return null
    if (story.comebackShown?.[dayKey]) return null
    return buildComeback(dayGap(prevLastSeen, now) ?? 0, seed)
  }, [returnType, story.comebackShown, dayKey, prevLastSeen, now, seed])

  // A chapter to gently reveal: the current one, if she hasn't seen it yet.
  const unseenChapter = useMemo(() => {
    if (!currentChapter) return null
    return story.ackChapters?.[currentChapter.id] ? null : currentChapter
  }, [currentChapter, story.ackChapters])

  // The first earned letter she hasn't seen yet (one at a time, in MILESTONES order).
  const unseenLetter = useMemo(
    () => letters.find((l) => !story.letterAcks?.[l.id]) || null,
    [letters, story.letterAcks],
  )

  // Stamp the visit exactly once per mount (the return signal for next time).
  useEffect(() => {
    setStory((s) => ({ ...s, lastSeen: now }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ackChapter = (id) => setStory((s) => ({ ...s, ackChapters: { ...s.ackChapters, [id]: true } }))
  const ackLetter = (id) => setStory((s) => ({ ...s, letterAcks: { ...(s.letterAcks || {}), [id]: true } }))
  const dismissComeback = () =>
    setStory((s) => ({ ...s, comebackShown: { ...s.comebackShown, [dayKey]: true } }))
  // Store a sanitized companion name (or clear it). Syncs as part of emily.story.
  const setCompanionName = (raw) => setStory((s) => ({ ...s, companionName: cleanName(raw) }))
  // Save (or clear) Emily's note for a chapter. Empty notes drop the key entirely.
  const setChapterNote = (id, raw) =>
    setStory((s) => {
      const next = { ...(s.notes || {}) }
      const note = cleanNote(raw)
      if (note) next[id] = note
      else delete next[id]
      return { ...s, notes: next }
    })

  return {
    metrics,
    currentChapter,
    nextLocked,
    unlocked,
    greeting,
    returnType,
    facts,
    comeback,
    unseenChapter,
    letters,
    unseenLetter,
    ackLetter,
    partOfDay,
    companionName,
    setCompanionName,
    notes: story.notes || {},
    setChapterNote,
    ackChapter,
    dismissComeback,
  }
}
