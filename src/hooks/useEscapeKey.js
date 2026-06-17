import { useEffect } from 'react'

/**
 * useEscapeKey — calls `onClose` when Escape is pressed, while `active`.
 * Reusable across the capture popover, reflection, and flashcard overlay.
 */
export default function useEscapeKey(onClose, active = true) {
  useEffect(() => {
    if (!active) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, active])
}
