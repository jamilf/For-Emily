import { useCallback, useEffect, useState } from 'react'

// A skippable typewriter reveal. Governs only the VISIBLE character count; the full
// text must always be rendered for screen readers by the caller (DialogueBox keeps a
// complete copy in the DOM), so this never gates content behind waiting.
//
// `instant` (reduced motion / minimal effects / typewriter off) reveals everything
// immediately. `skip()` completes the reveal on any tap or key. Brisk by default.

/**
 * @param {string} text
 * @param {{ cps?: number, enabled?: boolean, instant?: boolean }} [opts]
 *   cps = characters per second; enabled = typewriter on; instant = reveal at once.
 * @returns {{ shown: string, done: boolean, skip: () => void }}
 */
export default function useTypewriter(text, { cps = 50, enabled = true, instant = false } = {}) {
  const full = text ?? ''
  const immediate = !enabled || instant || !full
  const [count, setCount] = useState(() => (immediate ? full.length : 0))

  useEffect(() => {
    if (immediate) {
      setCount(full.length)
      return undefined
    }
    setCount(0)
    const stepMs = Math.max(8, Math.round(1000 / Math.max(1, cps)))
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          clearInterval(id)
          return c
        }
        return c + 1
      })
    }, stepMs)
    return () => clearInterval(id)
  }, [full, cps, immediate])

  const skip = useCallback(() => setCount(full.length), [full.length])

  return { shown: full.slice(0, count), done: count >= full.length, skip }
}
