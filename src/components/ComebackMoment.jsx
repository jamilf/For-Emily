import { useMemo } from 'react'
import GameWindow from '../ui/jrpg/GameWindow.jsx'
import ProceduralTree from './ProceduralTree.jsx'

/**
 * The comeback-positive welcome-back. Shown ONCE when she returns after a gap: the
 * grove kept her spot and a wildflower bloomed while she rested (rendered by the
 * shared tree generator from a deterministic DNA). Always welcoming — never a word
 * about loss, a broken streak, or absence as a fault. Full overlay pattern (focus
 * trap, aria-hidden backdrop, Esc, return-focus); honours reduced motion.
 */
export default function ComebackMoment({ comeback, companionName = null, onClose }) {
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  if (!comeback) return null

  return (
    <GameWindow
      modal
      title={`🌼 ${comeback.title}`}
      ariaLabel="Welcome back"
      onClose={onClose}
      closeLabel="Close welcome back"
      widthClass="max-w-sm"
      bodyClassName="flex flex-col items-center gap-3 overflow-y-auto p-6 text-center"
    >
      <div className="flex justify-center" aria-hidden="true">
        <ProceduralTree
          dna={comeback.bloomDna}
          stage="sprout"
          pixel={6}
          className={reduced ? '' : 'animate-float'}
        />
      </div>
      <p className="text-sm leading-relaxed text-brownDark/90" aria-live="polite">
        {comeback.note}
      </p>
      <p className="text-xs text-brown/60">
        {companionName ? `It's me, ${companionName}. ` : ''}Welcome back, Emily. Nothing here goes anywhere
        when you rest. Begin whenever you like.
      </p>
      <button
        onClick={onClose}
        className="mt-1 rounded-2xl bg-brown px-5 py-2.5 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        Thank you
      </button>
    </GameWindow>
  )
}
