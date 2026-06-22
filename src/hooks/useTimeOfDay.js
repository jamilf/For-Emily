import { useEffect, useState } from 'react'
import { timeOfDay } from '../data/daytime.js'

const REFRESH_MS = 10 * 60 * 1000 // re-check the part of day every ~10 minutes

/**
 * The current part of day ('dawn' | 'day' | 'dusk' | 'night'), kept loosely in sync
 * with the wall clock. Cheap: it only re-renders when the bucket actually changes,
 * on a slow interval (no animation, no per-frame work).
 */
export default function useTimeOfDay() {
  const [tod, setTod] = useState(() => timeOfDay())

  useEffect(() => {
    const tick = () =>
      setTod((prev) => {
        const next = timeOfDay()
        return next === prev ? prev : next
      })
    tick()
    const id = setInterval(tick, REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  return tod
}
