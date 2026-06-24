import { useRef } from 'react'
import useFocusTrap from '../../hooks/useFocusTrap.js'

/**
 * GameWindow — the cozy 16-bit JRPG window chrome, built once and adopted across
 * every panel and modal. A chunky pixel-beveled border (pure box-shadow, no images)
 * with a wood/indigo nameplate title bar, optional SVG corner ornaments, and a
 * subtle interior gradient. The identity piece of the UI kit.
 *
 * Variants:
 *   panel | status  → light, high-contrast cream "paper" body (long-form reading)
 *   dialogue | menu  → dark indigo dialogue-window body with cream text (genre id)
 *
 * Modes:
 *   inline (default) → a titled <section>, replacing the old WindowFrame.
 *   modal={true}     → adds an overlay + focus trap + Esc + role="dialog", replacing
 *                      the ad-hoc dialog shells. Keeps title/close semantics so the
 *                      existing modal tests (role + accessible name) pass unchanged.
 *
 * Flavour only: no slow transitions, no added taps. Everything is reachable by tap
 * and keyboard, and the close button keeps its existing accessible name.
 */

// Four small pixel-diamond corner ornaments, drawn with CSS box-shadow squares.
// Decorative only (aria-hidden); hidden entirely at Minimal effects via --fx-scale.
function Ornaments() {
  const dot = 'pointer-events-none absolute h-1.5 w-1.5 bg-jrpg-cursor'
  return (
    <span aria-hidden="true" className="jrpg-ornaments">
      <span className={`${dot} left-1 top-1`} style={{ opacity: 'calc(0.7 * var(--fx-scale))' }} />
      <span className={`${dot} right-1 top-1`} style={{ opacity: 'calc(0.7 * var(--fx-scale))' }} />
      <span className={`${dot} bottom-1 left-1`} style={{ opacity: 'calc(0.7 * var(--fx-scale))' }} />
      <span className={`${dot} bottom-1 right-1`} style={{ opacity: 'calc(0.7 * var(--fx-scale))' }} />
    </span>
  )
}

export default function GameWindow({
  title,
  ariaLabel,
  onClose,
  closeLabel,
  variant = 'panel',
  modal = false,
  ornaments = true,
  className = '',
  bodyClassName = '',
  bodyTone,
  widthClass = 'max-w-lg',
  headerRight = null,
  initialFocusRef,
  children,
  ...rest
}) {
  const dark = variant === 'dialogue' || variant === 'menu'
  const closeRef = useRef(null)

  // Modal-only: trap focus, handle Escape, lock scroll, and restore focus on close
  // (all provided by useFocusTrap). Inline panels skip this entirely.
  const trapRef = useFocusTrap(modal, {
    onEscape: onClose,
    initialFocus: initialFocusRef || closeRef,
  })

  // The body surface. Defaults to the variant tone; callers with a bespoke body
  // (e.g. the dark night-sky modals) pass their own `bodyTone` to override it.
  const tone = bodyTone ?? (dark ? 'bg-jrpg-window text-jrpg-text' : 'paper-grain bg-cream text-brownDark')

  const windowEl = (
    <div
      ref={modal ? trapRef : undefined}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal ? 'true' : undefined}
      aria-label={modal ? ariaLabel || title : undefined}
      tabIndex={modal ? -1 : undefined}
      className={`pixel-bevel relative flex flex-col overflow-hidden rounded-xl ${className}`}
      {...rest}
    >
      {ornaments && <Ornaments />}
      {/* Nameplate title bar — plum→indigo, cohesive across every window. */}
      <div
        className="jrpg-bar flex items-center gap-2 border-b-2 border-jrpg-edge px-3 py-2"
        style={{ background: 'linear-gradient(to bottom, #5C3A6E, #4A2F5C 55%, #352A52)' }}
      >
        <span aria-hidden="true" className="jrpg-bar-gem h-2.5 w-2.5 rotate-45 bg-jrpg-cursor" />
        <span className="ml-0.5 flex-1 truncate font-display text-base tracking-wide text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
          {title}
        </span>
        {headerRight}
        {onClose && (
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={closeLabel || `Close ${title}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        )}
      </div>
      {/* Body */}
      <div className={`relative flex flex-1 flex-col ${tone} ${bodyClassName}`}>{children}</div>
    </div>
  )

  if (!modal) return windowEl

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center modal-overlay-pad">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/80 sm:backdrop-blur-sm"
      />
      <div className={`animate-modal-in relative z-10 flex max-h-full w-full flex-col ${widthClass}`}>
        {windowEl}
      </div>
    </div>
  )
}
