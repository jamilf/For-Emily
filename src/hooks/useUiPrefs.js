import { useMemo } from 'react'
import usePersistedState from './useLocalStorage.js'
import { DEFAULTS } from '../storage/StorageManager.js'

/**
 * The cozy-JRPG theme prefs (device-local) plus derived motion state. Centralizes
 * the "should effects be instant?" decision so every kit piece agrees: reduced
 * motion OR the Minimal effects intensity collapses the flavour to its static,
 * instant alternative. `setUi` persists a partial update.
 *
 * @returns {{ effects: string, typewriter: boolean, sounds: number,
 *   reduced: boolean, instantMotion: boolean, fxScale: number,
 *   setUi: (patch: object) => void }}
 */
export default function useUiPrefs() {
  const [ui, setUiRaw] = usePersistedState('emily.ui', DEFAULTS['emily.ui'])
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  const effects = ui.effects || 'full'
  const instantMotion = reduced || effects === 'minimal'
  const fxScale = instantMotion ? 0 : effects === 'calm' ? 0.6 : 1

  const setUi = (patch) => setUiRaw((prev) => ({ ...prev, ...patch }))

  return {
    effects,
    typewriter: ui.typewriter !== false,
    sounds: ui.sounds ?? 0,
    onboarded: ui.onboarded === true,
    reduced,
    instantMotion,
    fxScale,
    setUi,
  }
}
