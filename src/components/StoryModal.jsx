import { useEffect, useMemo, useRef, useState } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import {
  CHAPTERS,
  cleanNote,
  deriveCurrentChapter,
  earnedLetters,
  nextChapter,
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
 * The Grove Story. A lazy, focus-trapped modal (same shell as every other dialog)
 * where Emily can re-read every chapter she's reached and glimpse — as a soft,
 * spoiler-free hint — that more is waiting. Chapters are pure derivations from
 * milestones she already earned; opening the story acknowledges the current one so
 * its reveal never nags again. State is shown by text, never colour alone.
 */
export default function StoryModal({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const [spirits] = usePersistedState('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })
  const [stats] = usePersistedState('emily.stats', EMPTY_STATS)
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [focusLog] = usePersistedState('emily.focusLog', {})
  const [story, setStory] = usePersistedState('emily.story', EMPTY_STORY)

  const metrics = useMemo(
    () => storyMetrics({ garden, spirits, stats, flashcardStats, reflections, focusLog }),
    [garden, spirits, stats, flashcardStats, reflections, focusLog],
  )
  const unlocked = useMemo(() => unlockedChapters(metrics), [metrics])
  const current = useMemo(() => deriveCurrentChapter(metrics), [metrics])
  const ahead = useMemo(() => nextChapter(metrics), [metrics])
  const letters = useMemo(() => earnedLetters(metrics), [metrics])
  const companionName = story.companionName || null
  const from = companionName || 'your soot friend'

  // Re-reading the story acknowledges the current chapter and any earned letters, so
  // their toasts won't re-show once she's seen them here.
  const acked = useRef(false)
  useEffect(() => {
    if (acked.current) return
    acked.current = true
    setStory((s) => {
      let next = s
      if (current && !s.ackChapters?.[current.id]) {
        next = { ...next, ackChapters: { ...next.ackChapters, [current.id]: true } }
      }
      const unseen = letters.filter((l) => !s.letterAcks?.[l.id])
      if (unseen.length) {
        const letterAcks = { ...(next.letterAcks || {}) }
        for (const l of unseen) letterAcks[l.id] = true
        next = { ...next, letterAcks }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, letters])

  const remaining = CHAPTERS.length - unlocked.length

  // Keeper's notes — her own line beside the sprite's, per chapter. Optional.
  const notes = story.notes || {}
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState('')

  function startNote(c) {
    setDraft(notes[c.id] || '')
    setEditingId(c.id)
  }
  function saveNote(id) {
    setStory((s) => {
      const next = { ...(s.notes || {}) }
      const note = cleanNote(draft)
      if (note) next[id] = note
      else delete next[id]
      return { ...s, notes: next }
    })
    setEditingId(null)
    setDraft('')
  }
  function clearNote(id) {
    setStory((s) => {
      const next = { ...(s.notes || {}) }
      delete next[id]
      return { ...s, notes: next }
    })
  }

  return (
    <GameWindow
      modal
      title="📖 Grove Story"
      ariaLabel="Grove Story"
      onClose={onClose}
      closeLabel="Close story"
      widthClass="max-w-2xl"
      bodyClassName="space-y-4 overflow-y-auto p-5"
    >
      {unlocked.length === 0 ? (
        <p className="text-sm text-brown/75">
          Your story begins with your first focus session. Start the timer when you&apos;re ready, and the
          grove will start to wake. I&apos;ll be here to tell you about it.
        </p>
      ) : (
        <>
          <p className="text-xs text-brown/60">
            Chapters open as you tend the grove. They stay here for you to re-read anytime, and a quiet
            stretch never closes one.
          </p>
          <ol className="space-y-3">
            {unlocked.map((c) => {
              const isCurrent = current && c.id === current.id
              return (
                <li key={c.id} className="rounded-2xl border-2 border-brown/15 bg-white/55 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display text-lg text-brown">{c.title}</p>
                    {isCurrent && (
                      <span className="rounded-full bg-ever-green/20 px-2 py-0.5 font-display text-[0.65rem] uppercase tracking-wide text-brown">
                        you are here
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-1.5">
                    {c.beats.map((b, i) => (
                      <p key={i} className="text-sm leading-relaxed text-brownDark/85">
                        {b}
                      </p>
                    ))}
                  </div>
                  <p className="mt-2 flex gap-2 text-sm text-brown/75">
                    <span aria-hidden="true">🌙</span>
                    <span>{c.hook}</span>
                  </p>

                  {/* Keeper's note — her own line, woven beside the sprite's. Optional. */}
                  <div className="mt-3 border-t border-brown/10 pt-3">
                    {editingId === c.id ? (
                      <div className="space-y-2">
                        <label htmlFor={`note-${c.id}`} className="block text-xs text-brown/60">
                          what&apos;s on your mind? only if you feel like it.
                        </label>
                        <textarea
                          id={`note-${c.id}`}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={2}
                          maxLength={140}
                          placeholder="a line for your grove…"
                          className="w-full resize-none rounded-xl border-2 border-brown/20 bg-white/80 p-2 text-sm text-brownDark placeholder:text-brown/40 focus:border-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveNote(c.id)}
                            className="rounded-xl bg-brown px-3 py-1.5 font-display text-xs text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-xl px-2 py-1.5 text-xs text-brown/60 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : notes[c.id] ? (
                      <div>
                        <p className="font-display text-xs uppercase tracking-wide text-brown/45">
                          you wrote
                        </p>
                        <p className="mt-0.5 text-sm italic leading-relaxed text-brownDark/85">
                          {notes[c.id]}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <button
                            onClick={() => startNote(c)}
                            className="text-xs text-brown/60 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => clearNote(c.id)}
                            className="text-xs text-brown/60 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                          >
                            clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startNote(c)}
                        className="text-xs text-brown/60 underline-offset-2 transition-colors hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                      >
                        ✎ leave a note
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          {ahead && (
            <div className="rounded-2xl border-2 border-dashed border-brown/20 bg-white/40 p-4 text-center">
              <p className="font-display text-sm text-brown">Something new is waiting up ahead</p>
              <p className="mt-1 text-xs text-brown/60">
                {remaining === 1
                  ? 'One more chapter is still folded up, ready for when you get there.'
                  : `${remaining} more chapters are still folded up, ready for when you get there.`}{' '}
                Keep tending, in your own time.
              </p>
            </div>
          )}
        </>
      )}

      {/* Letters the sprite wrote for Emily at real milestones. Kept to re-read. */}
      {letters.length > 0 && (
        <section aria-labelledby="story-letters-heading" className="space-y-3">
          <div>
            <h2 id="story-letters-heading" className="font-display text-base text-brown">
              Letters from {from}
            </h2>
            <p className="mt-0.5 text-xs text-brown/60">
              Little notes I wrote you along the way. They stay here for whenever you want them.
            </p>
          </div>
          <ol className="space-y-3">
            {letters.map((l) => (
              <li key={l.id} className="rounded-2xl border-2 border-brown/15 bg-white/55 p-4 text-brownDark">
                <p className="font-display text-base text-brown">
                  <span aria-hidden="true">💌 </span>
                  {l.title}
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {l.lines.map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed text-brownDark/85">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-right font-display text-sm text-brown/70">all my love, {from}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </GameWindow>
  )
}
