import { memo, useMemo } from 'react'
import { gridToRects, gridSize } from './gridRects.js'

/**
 * Shared pixel-art renderer — no image files.
 *
 * Paints a sprite grid as ONE `<svg>` with `shape-rendering="crispEdges"`: rows of
 * same-colour pixels are run-length merged into single `<rect>`s (see gridRects.js),
 * so even a high-resolution sprite costs a few hundred nodes at most. The viewBox is
 * in grid units and the element is sized to `cols x pixel`, so any cell size (whole
 * or fractional) stays crisp: SVG scales the geometry, never the raster.
 *
 * Contract (unchanged from the original box-shadow renderer):
 * @param {string[]} grid    Rows of strings (each char = 1 pixel).
 * @param {Object}   palette Map of char -> colour; missing chars are transparent.
 * @param {number}   pixel   Size of one pixel cell in px (default 4).
 */
function PixelSprite({ grid, palette, pixel = 4, className = '', style = {} }) {
  const { rects, cols, rows } = useMemo(() => {
    return { rects: gridToRects(grid, palette), ...gridSize(grid) }
  }, [grid, palette])

  // Snap the sprite's physical box to whole device pixels so neighbouring sprites
  // never land on half pixels and blur (the global --px convention).
  const width = Math.round(cols * pixel)
  const height = Math.round(rows * pixel)

  return (
    <svg
      aria-hidden="true"
      className={`pixelated ${className}`}
      style={{ width, height, display: 'block', ...style }}
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  )
}

// Memoized: with stable grid/palette references (callers pass module constants or
// memoized DNA-generated sprites), this skips re-renders driven by a ticking parent.
export default memo(PixelSprite)
