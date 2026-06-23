import { useRef } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'

/**
 * The Grove — one companion-led home for the world Emily has grown. It does not
 * duplicate those surfaces; it is a calm launcher that opens the existing modals
 * (Story, Almanac, Spirits, Memory Grove, Seasons, Themes, Constellations,
 * Journal), so the toolbar stops being a wall of buttons. Each choice closes the
 * hub and opens its surface. Standard focus-trapped overlay; state shown by text.
 */
const ITEMS = [
  { key: 'story', emoji: '📖', label: 'Grove Story', blurb: 'Your chapters, the keeper notes, and letters.' },
  { key: 'almanac', emoji: '🌿', label: 'Grove Almanac', blurb: 'Every tree varietal and how it grows.' },
  { key: 'spirits', emoji: '🌲', label: 'Forest Spirits', blurb: 'The little companions you have met.' },
  { key: 'memories', emoji: '🌳', label: 'Memory Grove', blurb: 'Trees you dedicated to a moment.' },
  {
    key: 'seasons',
    emoji: '🍂',
    label: 'Sanctuary Seasons',
    blurb: 'How the world shifts as the grove grows.',
  },
  { key: 'themes', emoji: '🎨', label: 'Scene Themes', blurb: 'Skies you have unlocked. Wear a favourite.' },
  {
    key: 'constellations',
    emoji: '🌌',
    label: 'Constellations',
    blurb: 'Your progress, drawn in the night sky.',
  },
  { key: 'journal', emoji: '📔', label: 'Journal', blurb: 'A quiet timeline of meaningful moments.' },
]

export default function GroveHub({ onClose, onOpen }) {
  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const choose = (key) => {
    onClose()
    onOpen?.(key)
  }

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
        aria-label="The Grove"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌿 The Grove
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close the grove"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain space-y-3 overflow-y-auto bg-cream p-5 text-brownDark">
          <p className="text-sm text-brown/75">
            Everything your grove has grown, in one place. Wander in whenever you like.
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ITEMS.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => choose(it.key)}
                  aria-label={`Open ${it.label}`}
                  className="flex h-full w-full flex-col rounded-2xl border-2 border-brown/15 bg-white/55 p-3 text-left transition-colors hover:border-brown/30 hover:bg-white/80 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ever-yellow"
                >
                  <span className="font-display text-sm text-brown">
                    <span aria-hidden="true">{it.emoji} </span>
                    {it.label}
                  </span>
                  <span className="mt-0.5 text-xs text-brown/65">{it.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
