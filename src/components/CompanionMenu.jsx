import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useFocusTrap from '../hooks/useFocusTrap.js'
import usePersistedState from '../hooks/useLocalStorage.js'
import useUiSound from '../hooks/useUiSound.js'
import { portalTarget } from '../utils/portalTarget.js'
import { companionLine } from '../data/companionLine.js'
import { weekReview } from '../data/weekReview.js'
import DialogueBox from '../ui/jrpg/DialogueBox.jsx'
import MenuList from '../ui/jrpg/MenuList.jsx'
import CommandButton from '../ui/jrpg/CommandButton.jsx'

/**
 * CompanionMenu — the overworld "talk to the NPC" panel. Tapping the soot companion
 * opens this small focus-trapped dialogue: it says one warm, state-aware line, then
 * offers quick actions that route into flows that already exist (read the letter,
 * start a session, review due cards, see the week, wander the grove) and lets Emily
 * name the companion. Purely additive: the dock, the timer's own Start, and the
 * header still reach everything directly. Built on the JRPG DialogueBox + MenuList.
 */
export default function CompanionMenu({
  companionName = null,
  dueCount = 0,
  hasMail = false,
  running = false,
  partOfDay = 'day',
  onReadLetter,
  onStartFocus,
  onReviewCards,
  onOpenGrove,
  onOpenWeek,
  onSetName,
  onClose,
}) {
  const trapRef = useFocusTrap(true, { onEscape: onClose })
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(companionName || '')

  // Derive the state the line notices from what the app already keeps.
  const [stats] = usePersistedState('emily.stats', { streak: 0 })
  const [focusLog] = usePersistedState('emily.focusLog', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const streak = stats.streak || 0
  const weekTrend = useMemo(() => weekReview(focusLog, { today: new Date() }).trend, [focusLog])
  const lastMood = reflections.length ? reflections[reflections.length - 1].mood : null

  // A stable, pure seed (no clock read during render) so the idle line varies with
  // her progress rather than churning within a single visit.
  const seed = reflections.length + Object.keys(focusLog).length + streak
  const line = useMemo(
    () =>
      companionLine({
        companionName,
        dueCount,
        hasMail,
        running,
        partOfDay,
        streak,
        weekTrend,
        lastMood,
        seed,
      }),
    [companionName, dueCount, hasMail, running, partOfDay, streak, weekTrend, lastMood, seed],
  )

  // A soft blip on summon and on leaving (safe no-op until audio is enabled). Kept in
  // a ref so it fires exactly once per open/close, not on every prefs change.
  const play = useUiSound()
  const playRef = useRef(play)
  playRef.current = play
  useEffect(() => {
    playRef.current('open')
    return () => playRef.current('close')
  }, [])

  // Fall back to the same plain term the tappable sprite uses ("the sprite").
  const name = companionName || 'the sprite'

  // Run an action, then close the panel.
  const act = (cb) => () => {
    cb?.()
    onClose()
  }

  const items = [
    hasMail && { key: 'letter', icon: '✉️', label: 'Read your letter', onSelect: act(onReadLetter) },
    !running && { key: 'focus', icon: '🌱', label: 'Start a focus session', onSelect: act(onStartFocus) },
    dueCount > 0 && {
      key: 'review',
      icon: '🃏',
      label: `Review ${dueCount} card${dueCount === 1 ? '' : 's'}`,
      onSelect: act(onReviewCards),
    },
    onOpenWeek && { key: 'week', icon: '📅', label: 'See your week', onSelect: act(onOpenWeek) },
    { key: 'grove', icon: '🌿', label: 'Wander the grove', onSelect: act(onOpenGrove) },
    onSetName && {
      key: 'name',
      icon: '✏️',
      label: companionName ? 'Rename me' : 'Give me a name',
      onSelect: () => setRenaming(true),
    },
    { key: 'never', icon: '🤍', label: 'Never mind', onSelect: onClose },
  ].filter(Boolean)

  function handleRename(e) {
    e.preventDefault()
    onSetName?.(draft)
    onClose()
  }

  // Portal out of the dashboard subtree: an ancestor carries a transform (the timer
  // column's slide-in / focus scale), which becomes the containing block for
  // `position: fixed` and would anchor this overlay to that column instead of the
  // viewport. `.app-root` has no transform, so `fixed inset-0` stays true to the
  // screen, and it keeps the `--fx-scale` / `data-fx` cascade a bare <body> portal
  // would drop.
  return createPortal(
    <div className="animate-fade-in modal-overlay-pad fixed inset-0 z-[55] flex items-center justify-center">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/70 sm:backdrop-blur-sm"
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Talk to ${name}`}
        tabIndex={-1}
        className="animate-modal-in relative z-10 w-full max-w-sm"
      >
        <DialogueBox name={name} text={renaming ? 'What should I be called?' : line}>
          {renaming ? (
            <form onSubmit={handleRename} className="space-y-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={24}
                autoFocus
                aria-label="A name for your companion"
                className="w-full rounded-lg border-2 border-brownDark/25 bg-cream px-3 py-2 text-sm text-brownDark outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
              />
              <div className="flex gap-2">
                <CommandButton type="submit" disabled={!draft.trim()}>
                  Save
                </CommandButton>
                <CommandButton
                  type="button"
                  variant="ghost"
                  sound="cancel"
                  onClick={() => setRenaming(false)}
                >
                  Never mind
                </CommandButton>
              </div>
            </form>
          ) : (
            <MenuList ariaLabel="What would you like to do?" items={items} />
          )}
        </DialogueBox>
      </div>
    </div>,
    portalTarget(),
  )
}
