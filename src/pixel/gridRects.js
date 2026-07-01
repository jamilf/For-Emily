// Pure grid-to-rects layer for the shared pixel renderer. A sprite grid (rows of
// chars) plus a palette (char -> colour) become a compact list of axis-aligned
// rects: runs of same-colour pixels in a row merge into ONE rect, so a sprite costs
// hundreds of rects instead of thousands of per-pixel nodes. No DOM, no React, no
// randomness: same inputs, same rects, always.

/**
 * The bounding size of a sprite grid.
 * @param {string[]} grid
 * @returns {{ cols: number, rows: number }}
 */
export function gridSize(grid = []) {
  let cols = 0
  for (const row of grid) cols = Math.max(cols, row.length)
  return { cols, rows: grid.length }
}

/**
 * Run-length merge a sprite grid into paintable rects. Characters with no palette
 * entry (including spaces) are transparent and produce nothing. Adjacent pixels in
 * the SAME row with the SAME resolved colour merge into a single rect (height 1).
 * Grid units, not device pixels: the renderer scales via the SVG viewBox.
 * @param {string[]} grid   rows of single-char pixels
 * @param {Object<string,string>} palette   char -> CSS colour
 * @returns {Array<{x:number,y:number,w:number,h:number,fill:string}>}
 */
export function gridToRects(grid = [], palette = {}) {
  const rects = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    let runFill = null
    let runStart = 0
    let runLen = 0
    const flush = () => {
      if (runFill && runLen > 0) rects.push({ x: runStart, y, w: runLen, h: 1, fill: runFill })
      runFill = null
      runLen = 0
    }
    for (let x = 0; x < row.length; x++) {
      const fill = palette[row[x]] || null
      if (fill === runFill && fill !== null) {
        runLen += 1
        continue
      }
      flush()
      if (fill) {
        runFill = fill
        runStart = x
        runLen = 1
      }
    }
    flush()
  }
  return rects
}
