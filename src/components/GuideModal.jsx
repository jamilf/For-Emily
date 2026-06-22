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
    how: "Pick one thing you'd like to do, start the 25 minute timer, and let everything else wait. When it ends, take the little 5 minute rest. A small tree grows beside you the whole time.",
    why: 'Starting is the hardest part, and choosing your one thing ahead of time makes it feel so much smaller. The built-in rest keeps you from running yourself empty, and the little tree gives your effort something to show for itself.',
  },
  {
    title: 'Focus Meter',
    how: "It quietly counts your minutes toward a gentle daily goal, and keeps a soft tally of the days you've shown up.",
    why: 'Seeing your own progress is one of the kindest ways to keep going. The day count is only ever a nudge, never a punishment, so a quiet day simply starts a fresh one. You are never behind here, love.',
  },
  {
    title: 'My Garden',
    how: 'Every finished session plants a tree, and they stay right where you left them until you choose to clear them.',
    why: "A small, visible 'you did that' after each session gives the work a payoff you can look back on. Watching your little garden fill in makes coming back feel worth it.",
  },
  {
    title: 'Grove Almanac',
    how: 'Open it from your garden to find a field guide of every tree varietal. You unlock new ones just by studying, and once unlocked they stay forever.',
    why: 'It turns ordinary sessions into a gentle collection to fill in over time. Nothing is ever taken away, so it is pure reward and never pressure. Just a little something to be curious about.',
  },
  {
    title: 'Forest Spirits',
    how: 'Small companion creatures who find you as you keep tending the grove. Each one appears from habits you already have, and stays once it arrives.',
    why: 'They are companions, not trophies, and a quiet stretch never sends one away. They are here so the world feels a little more alive, and a little more like it is keeping you company.',
  },
  {
    title: 'Firefly Calendar',
    how: 'A cozy map of your study days, where every finished session lights one firefly on its evening. Open it from the Focus Meter.',
    why: 'It shows your consistency without a trace of shame. Quiet days are simply quiet, never a failure, and the brighter evenings gently remind you how often you have shown up for yourself.',
  },
  {
    title: 'Memory Grove',
    how: 'Dedicate any tree you have grown as a permanent keepsake, with a title and a note, for a moment you want to hold onto.',
    why: 'Some sessions have a real win behind them: a finished assignment, a hard day you got through. This keeps that moment somewhere safe, in your own words, for as long as you like.',
  },
  {
    title: 'Grove Story',
    how: 'A gentle, unfolding story that opens a new chapter as you tend the grove. The sprite greets you when you arrive, and if you have been away a while, the grove keeps your spot and a wildflower blooms to welcome you back. Open it with the book button.',
    why: 'It gives you a soft thread to follow, and someone who remembers you between visits. Coming back always continues something real, and a gap is only ever met with a warm welcome, never guilt.',
  },
  {
    title: 'Letters from the sprite',
    how: 'Tap the little soot sprite for a short letter, chosen to fit the moment: a hard session, a finished one, the start of your day. Tap the heart to keep one and reread it whenever you need to.',
    why: 'A kind, well-timed word from a friend can be enough to keep you going when a session feels heavy. The kept ones are there for the days you need to hear it again.',
  },
  {
    title: 'Flashcards',
    how: 'Make cards, or paste a batch as "term - definition", pick a deck, and review. Try to recall the answer first, then flip and rate it Again, Hard, Good, or Easy (keys 1 to 4). Each session is capped so it always ends.',
    why: 'Pulling an answer from memory, then spacing the next review a little further out each time, is one of the best ways to make things truly stick. Rating honestly lets the hard cards come back sooner and the easy ones rest longer.',
  },
  {
    title: 'Journal',
    how: 'A quiet timeline of your meaningful moments, gathered from everything you have done. Open it from the toolbar.',
    why: 'It lets you look back and see the shape of your effort over time, all in one gentle place. Proof, on the harder days, of how much you have actually shown up.',
  },
  {
    title: 'Constellations',
    how: 'A night sky that lights up as you study, with constellations for your sessions, days, cards, and the spirits who find you.',
    why: 'It draws your scattered effort into something whole and quietly beautiful to look at. A reminder that all the little moments are connecting into something bigger.',
  },
  {
    title: 'Sanctuary Seasons',
    how: 'Your sanctuary slowly shifts through the seasons as your grove grows. Tap the season beside the date to read about where you are.',
    why: 'The world changing alongside you makes your progress feel real and alive. Rest is written in too, as winter, so the quiet times are part of the world, not a failing.',
  },
  {
    title: 'Focus Quests',
    how: 'A small daily board of gentle objectives, drawn from things you are already doing. Open it from the toolbar.',
    why: 'A few soft, reachable goals can make starting feel lighter. There is nothing to fail here, only gentle suggestions for what might feel good today.',
  },
  {
    title: 'Ambient Mixer',
    how: 'Tap Start, then blend rain, wind, a crackling fire, a coffee shop, and more, until it feels right. It never plays on its own.',
    why: 'A steady wash of background sound can soften the sudden noises that break your focus. It does not suit everyone, so treat it as a comfort to reach for, not a rule.',
  },
  {
    title: 'Brain Dump',
    how: 'The little notepad in the corner. When a stray thought tugs at you mid-session, write it down and let it go. It saves on its own.',
    why: 'Getting a circling thought out of your head and onto the page frees up the space you were using to hold it, so it stops coming back to interrupt you.',
  },
  {
    title: 'Breaks',
    how: 'Each rest offers something small and kind for your body, like the 20-20-20 eye break: look at something far away for twenty seconds.',
    why: 'A little movement and a glance into the distance ease the eye strain and stiffness that quietly build up at a screen. Your body is carrying you through this too.',
  },
  {
    title: 'Zen mode',
    how: 'The moon button gently tucks away the extra panels, leaving only what you need.',
    why: 'Fewer things on screen means fewer things pulling at your eyes, so it is easier to stay with the one thing in front of you.',
  },
  {
    title: 'Sync and backup',
    how: 'The cloud button signs you in with your email and a 6 digit code, no password needed. Sign in with the same email on your phone and laptop to carry everything between them. You can also save a backup file anytime, just below.',
    why: 'Your work is always safe on the device you are using. Signing in adds a private cloud copy so your garden, cards, stats, and kept letters follow you everywhere, and survive a cleared browser. Nothing you build here is ever fragile.',
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
            How your sanctuary works
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
            A gentle tour of what each part is for, and why it helps. Use what feels good, and leave the rest.
            There is no wrong way to be here, Emily.
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
