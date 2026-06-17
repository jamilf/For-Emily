import { useCallback, useEffect, useState } from 'react'

// A tiny same-tab event channel so multiple components bound to the same key
// stay in sync (e.g. the timer writes stats, the Focus Meter reads them).
// Exported so the cloud-sync engine can push pulled values into live state by
// writing to localStorage and broadcasting on the same channel.
export const CHANNEL = 'emily:storage'

/**
 * Write a value to localStorage and notify all mounted usePersistedState
 * instances (same tab) so they re-read immediately. Used by the sync engine to
 * apply values pulled from the cloud. Never throws.
 */
export function writeAndBroadcast(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(CHANNEL, { detail: { key } }))
  } catch {
    /* ignore quota errors */
  }
}

function safeLoad(key, initial) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return initial
    return JSON.parse(raw)
  } catch {
    return initial
  }
}

/**
 * usePersistedState — like useState, but persisted to localStorage under `key`
 * and kept in sync across components (same tab) and tabs (native storage event).
 * Loads safely on mount; never throws on quota/parse errors.
 */
export default function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => safeLoad(key, initial))

  // Write + broadcast — but only when the stored content actually changes.
  // This guard is essential: reloading from storage produces a new object
  // reference each time, which would otherwise re-trigger this effect and
  // ping-pong endlessly with the sync listener below.
  useEffect(() => {
    try {
      const serialized = JSON.stringify(value)
      if (localStorage.getItem(key) === serialized) return
      localStorage.setItem(key, serialized)
      window.dispatchEvent(new CustomEvent(CHANNEL, { detail: { key } }))
    } catch {
      /* ignore quota errors */
    }
  }, [key, value])

  // Listen for same-tab and cross-tab updates to the same key.
  useEffect(() => {
    function sync(e) {
      if (e.type === 'storage' && e.key !== key) return
      if (e.type === CHANNEL && e.detail?.key !== key) return
      setValue(safeLoad(key, initial))
    }
    window.addEventListener('storage', sync)
    window.addEventListener(CHANNEL, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANNEL, sync)
    }
    // `initial` is intentionally treated as a stable default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const set = useCallback((next) => {
    setValue((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  return [value, set]
}
