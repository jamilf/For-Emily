import { memo, useMemo } from 'react'

/**
 * Pure-CSS pixel-art renderer — no image files.
 *
 * Paints a grid of colored cells using a single element's `box-shadow`
 * (the classic CSS sprite technique). Each character in `grid` maps to a
 * color in `palette`; a space (or any key missing from the palette) is
 * left transparent.
 *
 * @param {string[]} grid    Rows of equal-length strings (each char = 1 pixel).
 * @param {Object}   palette Map of char -> hex color.
 * @param {number}   pixel   Size of one pixel cell in px (default 4).
 */
function PixelSprite({ grid, palette, pixel = 4, className = '', style = {} }) {
  const { shadow, cols, rows } = useMemo(() => {
    const shadows = []
    let maxCols = 0
    grid.forEach((row, y) => {
      maxCols = Math.max(maxCols, row.length)
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]]
        if (!color) continue // transparent
        shadows.push(`${x * pixel}px ${y * pixel}px 0 0 ${color}`)
      }
    })
    return { shadow: shadows.join(','), cols: maxCols, rows: grid.length }
  }, [grid, palette, pixel])

  return (
    <div
      aria-hidden="true"
      className={`pixelated relative ${className}`}
      style={{ width: cols * pixel, height: rows * pixel, ...style }}
    >
      {/* The single pixel cell; every other cell is a box-shadow clone of it. */}
      <span
        className="absolute left-0 top-0 block"
        style={{ width: pixel, height: pixel, boxShadow: shadow }}
      />
    </div>
  )
}

// Memoized: with stable grid/palette references (callers pass module constants or
// memoized DNA-generated sprites), this skips re-renders driven by a ticking parent.
export default memo(PixelSprite)
