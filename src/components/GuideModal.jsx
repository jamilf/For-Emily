import { useRef } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import BackupControls from './BackupControls.jsx'

/**
 * A short field guide to the app: what each piece does, how to use it, and the
 * reason it tends to help. Claims are kept modest and tied to the mechanism,
 * not to promises.
 */
const ENTRIES = [
  {
    title: 'Pomodoro',
    how: 'Name one thing you want to do, start the 25 minute timer, then take the 5 minute rest when it ends. A tree grows while you work.',
    why: 'Working in fixed blocks lowers the friction of starting, and deciding the single next step in advance makes it easier to begin. The scheduled rest keeps you from running on empty.',
  },
  {
    title: 'Focus Meter',
    how: 'Tracks your minutes against a gentle daily target, plus your run of study days.',
    why: 'Seeing progress you can measure is one of the steadier ways to keep a habit going. The streak is there to nudge, not to punish, so a missed day just starts a fresh count.',
  },
  {
    title: 'My Garden',
    how: 'Every finished focus session plants one tree. They stay until you clear them.',
    why: 'A small, visible reward for finishing gives the work a payoff you can look back on, and watching the garden fill up makes the habit feel worth repeating.',
  },
  {
    title: 'Ambient Mixer',
    how: 'Tap Start, then mix rain, wind, a fire, a coffee shop, and more to taste. It never plays on its own.',
    why: 'A steady background sound can cover sudden noises that break concentration. It does not work the same for everyone, so treat it as an option, not a rule.',
  },
  {
    title: 'Brain Dump',
    how: 'The notepad button in the corner. Write down whatever pops into your head mid task, then get back to work. It saves on its own.',
    why: 'Getting an intruding thought out of your head and onto the page frees up the mental space you were using to hold it, so it stops circling back.',
  },
  {
    title: 'Flashcards',
    how: 'Make cards (or paste a batch as "term - definition"), pick a deck, then review. Recall the answer first, flip, and rate it Again, Hard, Good, or Easy (keys 1–4). Sessions are capped so they always end.',
    why: 'Pulling an answer from memory, then spacing the next review further apart each time, is one of the best supported ways to make things stick. Rating honestly lets the schedule bring hard cards back sooner and easy ones much later.',
  },
  {
    title: 'Breaks',
    how: 'Each rest suggests something small and physical, like the 20-20-20 eye break: look at something 20 feet away for 20 seconds.',
    why: 'Short movement and looking into the distance ease the eye strain and stiffness that build up during long stretches at a screen.',
  },
  {
    title: 'Zen mode',
    how: 'The moon button hides the extra panels so only the essentials remain.',
    why: 'Fewer things on screen means fewer things to pull your eyes away from the task in front of you.',
  },
  {
    title: 'Letters from the sprite',
    how: 'Tap the little sprite for a short letter: encouragement or a verse, chosen to fit the moment (a hard session, a finished one, the start of your day). Tap the heart to keep a letter and reread it later.',
    why: 'A brief, kind, well-timed nudge can reset your mood enough to keep going when a session feels heavy. Saved letters are there for the days you need to hear it again.',
  },
  {
    title: 'Sync',
    how: 'The cloud button signs you in with your email and a 6-digit code (no password). Sign in with the same email on your phone and laptop to share progress.',
    why: 'Your work is always saved on the device you use it on. Signing in adds a private cloud backup so your flashcards, garden, stats, and kept letters follow you between devices, and survive clearing your browser.',
  },
]

export default function GuideModal({ onClose }) {
  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center modal-overlay-pad">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/75 sm:backdrop-blur-sm"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="How to use this app"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            What everything does
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close guide"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-5 overflow-y-auto bg-cream p-6 text-brownDark">
          <p className="text-sm text-brown/80">
            A quick tour of what each part is for, and why it tends to help. Use what works, skip what
            doesn&apos;t.
          </p>
          {ENTRIES.map((e) => (
            <div key={e.title}>
              <h3 className="font-display text-base text-brown">{e.title}</h3>
              <p className="mt-1 text-sm leading-relaxed">{e.how}</p>
              <p className="mt-1 text-sm leading-relaxed text-brown/70">{e.why}</p>
            </div>
          ))}
          <BackupControls />
        </div>
      </div>
    </div>
  )
}
