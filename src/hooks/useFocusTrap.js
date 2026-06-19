import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

/**
 * Trap keyboard focus inside an overlay for WCAG-compliant dialogs.
 *
 * While `active`, Tab / Shift+Tab cycle within the returned container, Escape
 * calls `onEscape`, and focus returns to whatever was focused before the overlay
 * opened when it unmounts. Focus starts on `initialFocus` (a ref) if given, else
 * the first focusable element, else the container itself.
 *
 * The container element should set `tabIndex={-1}` so it can receive focus as a
 * fallback when it holds no focusable children.
 *
 * @param {boolean} active        whether the trap is engaged
 * @param {object}  [opts]
 * @param {() => void} [opts.onEscape]      called on Escape
 * @param {{current: HTMLElement}} [opts.initialFocus]  element to focus first
 * @returns {{current: HTMLElement}} ref to attach to the dialog container
 */
export default function useFocusTrap(active = true, { onEscape, initialFocus } = {}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const container = containerRef.current
    if (!container) return undefined
    const previouslyFocused = document.activeElement

    const focusables = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

    // Defer initial focus a tick so the overlay has painted.
    const initial = initialFocus?.current || focusables()[0] || container
    initial?.focus?.()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || !container.contains(activeEl))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || !container.contains(activeEl))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Return focus to the opener for a seamless keyboard experience.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [active, onEscape, initialFocus])

  return containerRef
}
