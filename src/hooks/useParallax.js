import { useEffect } from 'react'

/**
 * useParallax — drives the scene's depth. It publishes three CSS custom properties
 * on <html> that the decorative scene bands read in their transforms:
 *   --par-x, --par-y : pointer offset from the viewport centre, ~[-1, 1]
 *   --par-scroll     : window.scrollY, in CSS pixels (unitless number)
 *
 * Pointer parallax is mouse-only (a fine pointer that hovers); touch devices still
 * get scroll parallax. Under prefers-reduced-motion it does nothing at all — no
 * listeners, no vars — so every band's `var(--par-*, 0)` falls back to 0 and the
 * scene stays perfectly still. Updates coalesce through a single rAF, and all
 * listeners are passive and torn down on unmount.
 */
export default function useParallax() {
  useEffect(() => {
    if (typeof window === 'undefined' || !document?.documentElement) return
    const mm = window.matchMedia
    if (mm && mm('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const finePointer = !!(mm && mm('(hover: hover) and (pointer: fine)').matches)

    let px = 0
    let py = 0
    let scroll = 0
    let raf = 0

    const apply = () => {
      raf = 0
      root.style.setProperty('--par-x', px.toFixed(4))
      root.style.setProperty('--par-y', py.toFixed(4))
      root.style.setProperty('--par-scroll', scroll.toFixed(1))
    }
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(apply)
    }

    const onPointer = (e) => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      px = (e.clientX / w) * 2 - 1
      py = (e.clientY / h) * 2 - 1
      schedule()
    }
    const onScroll = () => {
      scroll = window.scrollY || 0
      schedule()
    }

    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // seed the scroll offset immediately

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
