// Synthesized ambient layers — no audio files. Each layer is built entirely from
// Web Audio nodes (noise buffers + filters + scheduled envelopes), so nothing can
// 404 and the bundle stays tiny. The config array drives both the UI (sliders are
// generated from it) and the audio graph, and is the single place to add a layer.
//
// Each `build(ctx)` returns { output, dispose }:
//   output  — an AudioNode the mixer connects into the layer's GainNode
//   dispose — tears down sources / timers for that layer
//
// Naturalistic recordings would sound better, but these stylized approximations
// keep the zero-asset guarantee the app has always honored.

// ---- shared noise buffers ---------------------------------------------------
function whiteNoise(ctx, seconds = 2) {
  const frames = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function brownNoise(ctx, seconds = 2) {
  const frames = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < frames; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return buf
}

function loopSource(ctx, buffer) {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// A slow oscillator wired to modulate an AudioParam around a base value.
function attachLFO(ctx, param, { base, depth, rate }) {
  param.value = base
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = rate
  const depthGain = ctx.createGain()
  depthGain.gain.value = depth
  osc.connect(depthGain)
  depthGain.connect(param)
  osc.start()
  return () => {
    try {
      osc.stop()
    } catch {
      /* already stopped */
    }
  }
}

// ---- the layer configuration ------------------------------------------------
export const LAYERS = [
  {
    id: 'steadyRain',
    label: 'Steady Rain',
    icon: '🌧️',
    defaultVolume: 0.5,
    build(ctx) {
      const src = loopSource(ctx, whiteNoise(ctx))
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 500
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 7000
      src.connect(hp)
      hp.connect(lp)
      src.start()
      return { output: lp, dispose: () => safeStop(src) }
    },
  },
  {
    id: 'rainWindow',
    label: 'Rain on Window',
    icon: '🪟',
    defaultVolume: 0,
    build(ctx) {
      const src = loopSource(ctx, whiteNoise(ctx))
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1600
      const wobble = ctx.createGain()
      const stopLfo = attachLFO(ctx, wobble.gain, { base: 0.7, depth: 0.3, rate: 0.8 })
      src.connect(lp)
      lp.connect(wobble)
      src.start()
      return { output: wobble, dispose: () => (safeStop(src), stopLfo()) }
    },
  },
  {
    id: 'thunder',
    label: 'Distant Thunder',
    icon: '⛈️',
    defaultVolume: 0,
    build(ctx) {
      const src = loopSource(ctx, brownNoise(ctx))
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 220
      const env = ctx.createGain()
      env.gain.value = 0.0001
      src.connect(lp)
      lp.connect(env)
      src.start()
      // Schedule occasional low rumbles (≥6s apart) so it never strobes/repeats.
      let timer = null
      const roll = () => {
        const now = ctx.currentTime
        env.gain.cancelScheduledValues(now)
        env.gain.setValueAtTime(0.0001, now)
        env.gain.exponentialRampToValueAtTime(0.9, now + 0.25)
        env.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
        timer = setTimeout(roll, 6000 + Math.random() * 9000)
      }
      timer = setTimeout(roll, 2000 + Math.random() * 4000)
      return { output: env, dispose: () => (safeStop(src), clearTimeout(timer)) }
    },
  },
  {
    id: 'windTrees',
    label: 'Wind in Trees',
    icon: '🍃',
    defaultVolume: 0,
    build(ctx) {
      const src = loopSource(ctx, whiteNoise(ctx))
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.Q.value = 0.7
      // Slowly sweep the band for a gusting whoosh.
      const stopLfo = attachLFO(ctx, bp.frequency, { base: 700, depth: 350, rate: 0.12 })
      const out = ctx.createGain()
      out.gain.value = 0.9
      src.connect(bp)
      bp.connect(out)
      src.start()
      return { output: out, dispose: () => (safeStop(src), stopLfo()) }
    },
  },
  {
    id: 'fireplace',
    label: 'Crackling Fireplace',
    icon: '🔥',
    defaultVolume: 0,
    build(ctx) {
      // Low rumble bed.
      const rumbleSrc = loopSource(ctx, brownNoise(ctx))
      const rumbleLp = ctx.createBiquadFilter()
      rumbleLp.type = 'lowpass'
      rumbleLp.frequency.value = 420
      const out = ctx.createGain()
      out.gain.value = 0.8
      rumbleSrc.connect(rumbleLp)
      rumbleLp.connect(out)
      rumbleSrc.start()
      // Random crackle pops (short high-passed bursts).
      const crackleSrc = loopSource(ctx, whiteNoise(ctx))
      const crackleHp = ctx.createBiquadFilter()
      crackleHp.type = 'highpass'
      crackleHp.frequency.value = 2400
      const crackleEnv = ctx.createGain()
      crackleEnv.gain.value = 0.0001
      crackleSrc.connect(crackleHp)
      crackleHp.connect(crackleEnv)
      crackleEnv.connect(out)
      crackleSrc.start()
      let timer = null
      const pop = () => {
        const now = ctx.currentTime
        crackleEnv.gain.cancelScheduledValues(now)
        crackleEnv.gain.setValueAtTime(0.5 + Math.random() * 0.4, now)
        crackleEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.08)
        timer = setTimeout(pop, 120 + Math.random() * 500)
      }
      timer = setTimeout(pop, 300)
      return {
        output: out,
        dispose: () => (safeStop(rumbleSrc), safeStop(crackleSrc), clearTimeout(timer)),
      }
    },
  },
  {
    id: 'coffeeShop',
    label: 'Coffee Shop Murmur',
    icon: '☕',
    defaultVolume: 0,
    build(ctx) {
      const src = loopSource(ctx, brownNoise(ctx))
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 520
      bp.Q.value = 1.1
      const sway = ctx.createGain()
      const stopLfo = attachLFO(ctx, sway.gain, { base: 0.75, depth: 0.2, rate: 0.3 })
      src.connect(bp)
      bp.connect(sway)
      src.start()
      return { output: sway, dispose: () => (safeStop(src), stopLfo()) }
    },
  },
  {
    id: 'brownNoise',
    label: 'Brown Noise',
    icon: '🟤',
    defaultVolume: 0,
    build(ctx) {
      const src = loopSource(ctx, brownNoise(ctx))
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1000
      lp.Q.value = 0.6
      src.connect(lp)
      src.start()
      return { output: lp, dispose: () => safeStop(src) }
    },
  },
]

function safeStop(node) {
  try {
    node.stop()
  } catch {
    /* already stopped */
  }
}
