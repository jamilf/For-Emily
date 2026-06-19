import { useEffect, useState } from 'react'

/**
 * usePageHidden — tracks `document.hidden` (tab/window visibility).
 * Lets the app freeze decorative animations while the page is in the
 * background, mirroring the weather engine's own visibility pause.
 */
export default function usePageHidden() {
  const [hidden, setHidden] = useState(() => (typeof document === 'undefined' ? false : document.hidden))
  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return hidden
}
