import GameWindow from '../ui/jrpg/GameWindow.jsx'
import MenuList from '../ui/jrpg/MenuList.jsx'

/**
 * The Grove — one companion-led home for the world Emily has grown. It does not
 * duplicate those surfaces; it is a calm launcher that opens the existing modals
 * (Story, Almanac, Spirits, Memory Grove, Seasons, Themes, Constellations,
 * Journal), so the toolbar stops being a wall of buttons. Built from the shared
 * JRPG kit: a GameWindow holding a MenuList whose pixel cursor follows real focus.
 * Each choice closes the hub and opens its surface. State is shown by text.
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
  const choose = (key) => {
    onClose()
    onOpen?.(key)
  }

  const items = ITEMS.map((it) => ({
    key: it.key,
    label: it.label,
    sublabel: it.blurb,
    icon: it.emoji,
    ariaLabel: `Open ${it.label}`,
    onSelect: () => choose(it.key),
  }))

  return (
    <GameWindow
      modal
      title="🌿 The Grove"
      onClose={onClose}
      closeLabel="Close the grove"
      bodyClassName="space-y-3 overflow-y-auto p-5"
    >
      <p className="text-sm text-brown/75">
        Everything your grove has grown, in one place. Wander in whenever you like.
      </p>
      <MenuList ariaLabel="Grove surfaces" items={items} />
    </GameWindow>
  )
}
