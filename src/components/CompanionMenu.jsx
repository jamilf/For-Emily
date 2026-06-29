import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import useFocusTrap from '../hooks/useFocusTrap.js'
import DialogueBox from '../ui/jrpg/DialogueBox.jsx'
import MenuList from '../ui/jrpg/MenuList.jsx'

/**
 * CompanionMenu — the overworld "talk to the NPC" panel. Tapping the soot companion
 * opens this small focus-trapped dialogue: it says one short contextual line, then
 * offers a few quick actions that route into flows that already exist (read the
 * letter, start a session, review due cards, wander the grove). Purely additive: the
 * dock, the timer's own Start, and the header still reach everything directly, so the
 * NPC adds a path and removes none. Built on the JRPG DialogueBox + MenuList.
 */
function pickLine({ companionName, dueCount, hasMail }) {
  const who = companionName ? `, ${companionName}` : ''
  if (hasMail) return 'Oh, before you go. I left a little letter for you, for whenever you have a moment.'
  if (dueCount > 0) {
    return `There are ${dueCount} card${dueCount === 1 ? '' : 's'} waiting whenever you feel like it. No rush at all.`
  }
  // A couple of calm idle lines, chosen by the day so it varies without churning.
  const idle = [
    `Take your time here. I am happy just to keep you company${who}.`,
    'Whenever you are ready, we can begin. And if not, that is alright too.',
    'The grove is quiet and the kettle is warm. What feels good right now?',
  ]
  return idle[new Date().getDay() % idle.length]
}

export default function CompanionMenu({
  companionName = null,
  dueCount = 0,
  hasMail = false,
  running = false,
  onReadLetter,
  onStartFocus,
  onReviewCards,
  onOpenGrove,
  onClose,
}) {
  const trapRef = useFocusTrap(true, { onEscape: onClose })
  const name = companionName || 'your soot friend'
  const line = useMemo(
    () => pickLine({ companionName, dueCount, hasMail }),
    [companionName, dueCount, hasMail],
  )

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
    { key: 'grove', icon: '🌿', label: 'Wander the grove', onSelect: act(onOpenGrove) },
    { key: 'never', icon: '🤍', label: 'Never mind', onSelect: onClose },
  ].filter(Boolean)

  // Portal to <body>: this panel is rendered deep inside the dashboard, where an
  // ancestor carries a transform (the timer column's slide-in / focus scale). A
  // transformed ancestor becomes the containing block for `position: fixed`, which
  // would anchor this overlay to that column instead of the viewport. Portaling out
  // keeps `fixed inset-0` true to the screen on every device.
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
        <DialogueBox name={name} text={line}>
          <MenuList ariaLabel="What would you like to do?" items={items} />
        </DialogueBox>
      </div>
    </div>,
    document.body,
  )
}
