import { memo, useMemo } from 'react'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { generate } from '../pixel/SpiritGenerator.js'
import { SPIRITS_BY_ID } from '../data/spirits.js'

// Same faded silhouette tone the Grove uses for locked trees (AA-legible).
const LOCK_TONE = '#9a8e7c'

function lockedPalette(palette) {
  const out = {}
  for (const key of Object.keys(palette)) out[key] = LOCK_TONE
  return out
}

/**
 * Shared renderer for a Forest Spirit (mirrors ProceduralTree): resolves the
 * spirit's deterministic sprite and paints it via PixelSprite. `state="locked"`
 * recolours the same grid to a single silhouette tone so the shape still reads.
 * Decorative only (aria-hidden) — the accessible name lives on the parent control.
 */
function ProceduralSpirit({ spiritId, state = 'unlocked', pixel = 5, className = '' }) {
  const { grid, palette } = useMemo(() => {
    const spirit = SPIRITS_BY_ID[spiritId]
    const sprite = generate(spirit?.seed ?? 0, spirit?.paletteKey)
    return state === 'locked' ? { grid: sprite.grid, palette: lockedPalette(sprite.palette) } : sprite
  }, [spiritId, state])

  return (
    <div aria-hidden="true" className={className}>
      <PixelSprite grid={grid} palette={palette} pixel={pixel} />
    </div>
  )
}

export default memo(ProceduralSpirit)
