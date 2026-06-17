import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'emily.sound'

function loadSetting() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { on: false, volume: 0.5 }
    const parsed = JSON.parse(raw)
    return {
      on: Boolean(parsed.on),
      volume: typeof parsed.volume === 'number' ? parsed.volume : 0.5,
    }
  } catch {
    return { on: false, volume: 0.5 }
  }
}

/**
 * useSoundscape — a soft, fully-synthesized rain/café hum via the Web Audio API.
 * No audio files. Looping brown noise → low-pass filter → master gain.
 * Never autoplays: audio only starts on a user gesture (toggle). The last
 * setting is remembered in emily.sound, but a tap is required to start on reload.
 */
export default function useSoundscape() {
  const initial = loadSetting()
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(initial.volume)

  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const sourceRef = useRef(null)

  // Persist setting (intended on/off + volume).
  const persist = useCallback((on, vol) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ on, volume: vol }))
    } catch {
      /* ignore */
    }
  }, [])

  const buildGraph = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()

    // ~2s of brown noise, looped.
    const frames = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < frames; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5 // gentle gain back up
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.6

    const gain = ctx.createGain()
    gain.gain.value = 0

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    ctxRef.current = ctx
    gainRef.current = gain
    sourceRef.current = source
    return { ctx, gain }
  }, [])

  const start = useCallback(() => {
    let nodes = ctxRef.current ? { ctx: ctxRef.current, gain: gainRef.current } : buildGraph()
    if (!nodes) return
    const { ctx, gain } = nodes
    if (ctx.state === 'suspended') ctx.resume()
    // Smooth fade-in to the chosen volume.
    const target = Math.max(0.0001, volume) * 0.4
    gain.gain.cancelScheduledValues(ctx.currentTime)
    gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4)
    setPlaying(true)
    persist(true, volume)
  }, [buildGraph, volume, persist])

  const stop = useCallback(() => {
    const ctx = ctxRef.current
    const gain = gainRef.current
    if (ctx && gain) {
      gain.gain.cancelScheduledValues(ctx.currentTime)
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
    }
    setPlaying(false)
    persist(false, volume)
  }, [volume, persist])

  const toggle = useCallback(() => {
    if (playing) stop()
    else start()
  }, [playing, start, stop])

  const setVolume = useCallback(
    (v) => {
      setVolumeState(v)
      const ctx = ctxRef.current
      const gain = gainRef.current
      if (playing && ctx && gain) {
        gain.gain.setTargetAtTime(Math.max(0.0001, v) * 0.4, ctx.currentTime, 0.2)
      }
      persist(playing, v)
    },
    [playing, persist],
  )

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      try {
        sourceRef.current?.stop()
        ctxRef.current?.close()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { playing, toggle, volume, setVolume }
}
