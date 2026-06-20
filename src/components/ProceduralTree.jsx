import { memo, useMemo } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { generate } from '../pixel/PlantGenerator.js'

// Single faded ink for the "locked" silhouette — recognisably tree-shaped without
// revealing the varietal's real colours. AA-legible on the cream card background.
const LOCK_TONE = '#9a8e7c'

function lockedPalette(palette) {
  const out = {}
  for (const key of Object.keys(palette)) out[key] = LOCK_TONE
  return out
}

/**
 * The one renderer for every tree in the app — pot, My Garden, and the Almanac.
 * Wraps the deterministic generator + PixelSprite; memoised so a grid of ~20
 * stays cheap and never regenerates on scroll. `state="locked"` recolours the
 * exact same geometry to a faded monochrome silhouette.
 *
 * Decorative by default (aria-hidden) — the card around it supplies the label.
 */
function ProceduralTree({ dna, stage = 'mature', pixel = 4, state = 'unlocked', className = '' }) {
  const { grid, palette } = useMemo(() => {
    const tree = generate(dna, stage)
    return state === 'locked' ? { grid: tree.grid, palette: lockedPalette(tree.palette) } : tree
  }, [dna, stage, state])

  return (
    <div aria-hidden="true" className={className}>
      <PixelSprite grid={grid} palette={palette} pixel={pixel} />
    </div>
  )
}

export default memo(ProceduralTree)
