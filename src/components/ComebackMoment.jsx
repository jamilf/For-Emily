import { useMemo, useRef } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import ProceduralTree from './ProceduralTree.jsx'

/**
 * The comeback-positive welcome-back. Shown ONCE when she returns after a gap: the
 * grove kept her spot and a wildflower bloomed while she rested (rendered by the
 * shared tree generator from a deterministic DNA). Always welcoming — never a word
 * about loss, a broken streak, or absence as a fault. Full overlay pattern (focus
 * trap, aria-hidden backdrop, Esc, return-focus); honours reduced motion.
 */
export default function ComebackMoment({ comeback, onClose }) {
  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  if (!comeback) return null

  return (
    <div className="animate-fade-in modal-overlay-pad fixed inset-0 z-50 flex items-center justify-center">
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
        aria-label="Welcome back"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌼 {comeback.title}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close welcome back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain flex flex-col items-center gap-3 overflow-y-auto bg-cream p-6 text-center text-brownDark">
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
            Welcome back, Emily. Nothing here goes anywhere when you rest. Begin whenever you like.
          </p>
          <button
            onClick={onClose}
            className="mt-1 rounded-2xl bg-brown px-5 py-2.5 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Thank you
          </button>
        </div>
      </div>
    </div>
  )
}
