import { useEffect } from 'react'

// Module-level ref count so nested/stacked overlays lock once and only restore when
// the last one closes. Stores the page scroll position + the body styles we touched.
let lockCount = 0
let savedScrollY = 0
let savedBody = null

function lock() {
  const body = document.body
  savedScrollY = window.scrollY || window.pageYOffset || 0
  // Compensate for the scrollbar that disappears when we pin the body (desktop) so
  // the layout doesn't shift sideways.
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  savedBody = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    overscrollBehavior: body.style.overscrollBehavior,
    paddingRight: body.style.paddingRight,
  }
  // position:fixed is the reliable way to stop iOS Safari scrolling the background.
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'contain'
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
}

function unlock() {
  const body = document.body
  if (savedBody) {
    body.style.position = savedBody.position
    body.style.top = savedBody.top
    body.style.left = savedBody.left
    body.style.right = savedBody.right
    body.style.width = savedBody.width
    body.style.overflow = savedBody.overflow
    body.style.overscrollBehavior = savedBody.overscrollBehavior
    body.style.paddingRight = savedBody.paddingRight
    savedBody = null
  }
  try {
    window.scrollTo(0, savedScrollY)
  } catch {
    /* jsdom / unsupported — ignore */
  }
}

/**
 * Lock background scrolling while an overlay is open, with scroll-position restore on
 * close. Ref-counted so multiple overlays coexist. iOS-safe (pins the body) and
 * compensates for the scrollbar so there's no horizontal jump. No dependencies.
 *
 * @param {boolean} active  whether the lock is engaged (defaults to true)
 */
export default function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined
    if (lockCount === 0) lock()
    lockCount += 1
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) unlock()
    }
  }, [active])
}
