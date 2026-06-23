import { useEffect } from 'react'

/**
 * useParallax — drives the scene's depth. It publishes three CSS custom properties
 * on <html> that the decorative scene bands read in their transforms:
 *   --par-x, --par-y : pointer offset from the viewport centre, in [-1, 1]
 *   --par-scroll     : scroll progress, a bounded 0..1 (NOT raw pixels)
 *
 * The published values are EASED toward their targets in a self-stopping rAF loop
 * (cur += (target - cur) * EASE), so fast scrolls and quick pointer moves glide in
 * instead of snapping or flinging. The scroll signal is clamped to 0..1 over ~1.2
 * viewports, so no matter how far or fast Emily scrolls the bands only ever drift a
 * few bounded pixels. Pointer parallax is mouse-only (a fine pointer that hovers);
 * touch still gets scroll parallax. Under prefers-reduced-motion it does nothing at
 * all — no listeners, no vars — so every band's `var(--par-*, 0)` falls back to 0
 * and the scene stays perfectly still. All listeners are passive and torn down on
 * unmount, and the loop idles (no rAF) once settled.
 */
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const EASE = 0.12
const EPS = 0.0006

export default function useParallax() {
  useEffect(() => {
    if (typeof window === 'undefined' || !document?.documentElement) return
    const mm = window.matchMedia
    if (mm && mm('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const finePointer = !!(mm && mm('(hover: hover) and (pointer: fine)').matches)

    // targets (set by input) and current (eased) values
    let tx = 0
    let ty = 0
    let ts = 0
    let cx = 0
    let cy = 0
    let cs = 0
    let raf = 0

    const write = () => {
      root.style.setProperty('--par-x', cx.toFixed(4))
      root.style.setProperty('--par-y', cy.toFixed(4))
      root.style.setProperty('--par-scroll', cs.toFixed(4))
    }

    const frame = () => {
      cx += (tx - cx) * EASE
      cy += (ty - cy) * EASE
      cs += (ts - cs) * EASE
      const settled = Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ts - cs) < EPS
      if (settled) {
        cx = tx
        cy = ty
        cs = ts
        write()
        raf = 0
        return
      }
      write()
      raf = window.requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = window.requestAnimationFrame(frame)
    }

    const onPointer = (e) => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      tx = clamp((e.clientX / w) * 2 - 1, -1, 1)
      ty = clamp((e.clientY / h) * 2 - 1, -1, 1)
      kick()
    }
    const onScroll = () => {
      const span = (window.innerHeight || 1) * 1.2
      ts = clamp((window.scrollY || 0) / span, 0, 1)
      kick()
    }

    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // seed the scroll target immediately

    return () => {
      if (finePointer) window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
      root.style.removeProperty('--par-x')
      root.style.removeProperty('--par-y')
      root.style.removeProperty('--par-scroll')
    }
  }, [])
}
