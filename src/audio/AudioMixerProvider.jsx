import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import { DEFAULTS } from '../storage/StorageManager.js'
import { LAYERS } from './ambientLayers.js'

/**
 * AudioMixerProvider — owns the single AudioContext and the synthesized ambient
 * graph for the whole app. Exposes start/stop/mute, per-layer + master volume,
 * and the focus-fade ramps used by the Pomodoro timer.
 *
 * Graph:  [layer.output] → layerGain → masterGain → compressor → destination
 *
 * The context is created lazily on the first user gesture and suspended whenever
 * audio is stopped or the tab is hidden, so it never autoplays and never burns
 * CPU in the background.
 */
const MixerContext = createContext(null)

// iOS/WebKit audio unlock. On iPhone (Safari *and* iOS Chrome both run WebKit)
// a freshly created context stays muted after resume() until a real source has
// actually played through it once inside the user gesture — and on some versions
// the resume() promise won't even settle until then. Playing a single silent
// frame here primes the hardware. Harmless on desktop and Android.
function unlockOutput(ctx) {
  try {
    const src = ctx.createBufferSource()
    src.buffer = ctx.createBuffer(1, 1, 22050)
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    /* createBuffer/start unsupported — ignore */
  }
}

export function useMixer() {
  const ctx = useContext(MixerContext)
  if (!ctx) throw new Error('useMixer must be used within <AudioMixerProvider>')
  return ctx
}

export default function AudioMixerProvider({ children }) {
  const [mixer, setMixer] = usePersistedState('emily.mixer', DEFAULTS['emily.mixer'])

  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const layerGainsRef = useRef({}) // id -> GainNode
  const disposersRef = useRef([]) // teardown fns
  const userMasterRef = useRef(mixer.master) // master to restore after a fade
  userMasterRef.current = mixer.master

  // Build the synthesized graph onto an already-running context. Source nodes
  // (buffers/oscillators) are only started here, never before the context is
  // running — iOS/Android WebKit silently drop sources started while suspended.
  const buildGraph = useCallback((ctx) => {
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -12
    compressor.ratio.value = 4
    compressor.connect(ctx.destination)

    const master = ctx.createGain()
    master.gain.value = 0 // ramps up on start
    master.connect(compressor)

    LAYERS.forEach((layer) => {
      const { output, dispose } = layer.build(ctx)
      const g = ctx.createGain()
      g.gain.value = mixer.levels[layer.id] ?? layer.defaultVolume
      output.connect(g)
      g.connect(master)
      layerGainsRef.current[layer.id] = g
      disposersRef.current.push(dispose)
    })

    masterRef.current = master
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rampParam = (param, value, seconds = 0.25) => {
    const ctx = ctxRef.current
    if (!ctx || !param) return
    param.cancelScheduledValues(ctx.currentTime)
    param.setTargetAtTime(Math.max(0.0001, value), ctx.currentTime, Math.max(0.05, seconds / 3))
  }

  const start = useCallback(() => {
    // Create the context lazily, inside this user gesture.
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      ctxRef.current = new Ctx()
    }
    const ctx = ctxRef.current

    // Prime the hardware while we still hold the user gesture (iOS unlock).
    unlockOutput(ctx)

    // Build (and start) the graph only once the context is actually running, so
    // WebKit can't silently drop sources that were started while suspended.
    const begin = () => {
      if (!masterRef.current) buildGraph(ctx)
      rampParam(masterRef.current?.gain, userMasterRef.current, 0.4)
      setMixer((m) => ({ ...m, enabled: true }))
    }

    if (ctx.state === 'running') {
      begin()
      return
    }
    // resume() must be kicked off synchronously within the gesture (mobile unlock).
    const p = ctx.resume()
    if (p && typeof p.then === 'function') p.then(begin).catch(begin)
    else begin()
  }, [buildGraph, setMixer])

  const stop = useCallback(() => {
    const ctx = ctxRef.current
    if (ctx && masterRef.current) {
      rampParam(masterRef.current.gain, 0.0001, 0.4)
      // Suspend shortly after the fade so we stop burning CPU.
      setTimeout(() => {
        if (ctxRef.current && ctxRef.current.state === 'running') ctxRef.current.suspend()
      }, 500)
    }
    setMixer((m) => ({ ...m, enabled: false }))
  }, [setMixer])

  const setLevel = useCallback(
    (id, v) => {
      const g = layerGainsRef.current[id]
      if (g) rampParam(g.gain, v, 0.2)
      setMixer((m) => ({ ...m, levels: { ...m.levels, [id]: v } }))
    },
    [setMixer],
  )

  const setMaster = useCallback(
    (v) => {
      userMasterRef.current = v
      if (mixer.enabled) rampParam(masterRef.current?.gain, v, 0.2)
      setMixer((m) => ({ ...m, master: v }))
    },
    [mixer.enabled, setMixer],
  )

  const muteAll = useCallback(() => {
    LAYERS.forEach((layer) => {
      const g = layerGainsRef.current[layer.id]
      if (g) rampParam(g.gain, 0.0001, 0.2)
    })
    setMixer((m) => ({ ...m, levels: Object.fromEntries(LAYERS.map((l) => [l.id, 0])) }))
  }, [setMixer])

  // Focus-fade hooks for the Pomodoro timer (do not touch persisted master).
  const rampMaster = useCallback((target, seconds) => {
    const ctx = ctxRef.current
    const g = masterRef.current?.gain
    if (!ctx || !g) return
    g.cancelScheduledValues(ctx.currentTime)
    g.linearRampToValueAtTime(Math.max(0.0001, target), ctx.currentTime + seconds)
  }, [])

  const restoreMaster = useCallback((seconds) => rampMaster(userMasterRef.current, seconds), [rampMaster])

  // Suspend audio while the tab is hidden; resume if it was playing.
  useEffect(() => {
    function onVisibility() {
      const ctx = ctxRef.current
      if (!ctx) return
      if (document.hidden && ctx.state === 'running') ctx.suspend()
      else if (!document.hidden && mixer.enabled && ctx.state === 'suspended') ctx.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [mixer.enabled])

  // Tear down on unmount. Snapshot the refs inside the effect so the cleanup
  // closes over stable values (per react-hooks/exhaustive-deps).
  useEffect(() => {
    const disposers = disposersRef
    const ctx = ctxRef
    return () => {
      disposers.current.forEach((d) => {
        try {
          d()
        } catch {
          /* ignore */
        }
      })
      try {
        ctx.current?.close()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const value = {
    layers: LAYERS,
    enabled: mixer.enabled,
    master: mixer.master,
    levels: mixer.levels,
    start,
    stop,
    setLevel,
    setMaster,
    muteAll,
    rampMaster,
    restoreMaster,
  }

  return <MixerContext.Provider value={value}>{children}</MixerContext.Provider>
}
