import { useCallback } from 'react'
import { useMixerSafe } from '../audio/AudioMixerProvider.jsx'
import useUiPrefs from './useUiPrefs.js'

/**
 * Returns a `play(kind)` for JRPG menu blips (cursor | confirm | cancel | open |
 * close). Always safe to call: it is a no-op outside the mixer provider, before the
 * user has started audio, or when the UI-sound volume is 0. Sound is additive, never
 * the only feedback channel.
 */
export default function useUiSound() {
  const mixer = useMixerSafe()
  const { sounds } = useUiPrefs()
  return useCallback(
    (kind) => {
      mixer?.uiSound?.(kind, sounds)
    },
    [mixer, sounds],
  )
}
