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
// Fill a Float32Array with one of three noise colours. White is flat and bright;
// pink rolls off ~3 dB/oct (Paul Kellet's filter) for a warmer, far less "buzzy"
// hiss; brown rolls off ~6 dB/oct for a soft low rumble. Each call advances its
// own state, so filling two channels gives a decorrelated (naturally wide) stereo
// field rather than the old dead-centre mono.
function fillNoise(data, kind) {
  const n = data.length
  if (kind === 'white') {
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
    return
  }
  if (kind === 'brown') {
    let last = 0
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.5
    }
    return
  }
  // pink (Paul Kellet's economical approximation)
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.969 * b2 + w * 0.153852
    b3 = 0.8665 * b3 + w * 0.3104856
    b4 = 0.55 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.016898
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
}

// A seamless, looping STEREO noise buffer. The old layers looped a flat 2-second
// mono buffer with `loop = true`, so every 2s the waveform jumped back to its
// start and clicked. Here we generate a longer take plus an `overlap` tail, then
// equal-power crossfade that tail back over the head — the loop point becomes
// continuous and the click is gone. Channels are filled independently for width.
function noiseBuffer(ctx, kind, seconds = 10, overlap = 0.5) {
  const N = Math.floor(ctx.sampleRate * seconds)
  const O = Math.min(Math.floor(ctx.sampleRate * overlap), Math.floor(N / 2))
  const buf = ctx.createBuffer(2, N, ctx.sampleRate)
  const gen = new Float32Array(N + O)
  for (let ch = 0; ch < 2; ch++) {
    fillNoise(gen, kind)
    const out = buf.getChannelData(ch)
    for (let i = 0; i < N; i++) out[i] = gen[i]
    // Crossfade the continuation (gen[N..N+O)) over the head so head meets tail.
    for (let i = 0; i < O; i++) {
      const x = (i / O) * 0.5 * Math.PI
      out[i] = gen[i] * Math.sin(x) + gen[N + i] * Math.cos(x)
    }
  }
  return buf
}

function loopSource(ctx, buffer) {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// A slow oscillator wired to modulate an AudioParam around a base value. The
// modulation depth fades in over ~0.9s (setTargetAtTime) instead of snapping to
// full depth, so a layer never lurches the instant it starts.
function attachLFO(ctx, param, { base, depth, rate }) {
  param.value = base
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = rate
  const depthGain = ctx.createGain()
  depthGain.gain.value = 0
  depthGain.gain.setTargetAtTime(depth, ctx.currentTime, 0.3)
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
      const src = loopSource(ctx, noiseBuffer(ctx, 'pink'))
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
      const src = loopSource(ctx, noiseBuffer(ctx, 'pink'))
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
      const src = loopSource(ctx, noiseBuffer(ctx, 'brown'))
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
      const src = loopSource(ctx, noiseBuffer(ctx, 'pink'))
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
      // Warm low rumble bed, with a touch more body than before.
      const rumbleSrc = loopSource(ctx, noiseBuffer(ctx, 'brown'))
      const rumbleLp = ctx.createBiquadFilter()
      rumbleLp.type = 'lowpass'
      rumbleLp.frequency.value = 480
      const out = ctx.createGain()
      out.gain.value = 0.85
      rumbleSrc.connect(rumbleLp)
      rumbleLp.connect(out)
      rumbleSrc.start()
      // Crackle: short high-passed bursts whose brightness, size, and spacing all
      // vary, with the occasional bigger, lower ember pop, so it reads like a real
      // fire instead of a metronome of identical clicks.
      const crackleSrc = loopSource(ctx, noiseBuffer(ctx, 'white'))
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
        const ember = Math.random() < 0.16 // an occasional bigger, warmer pop
        const peak = ember ? 0.7 + Math.random() * 0.3 : 0.32 + Math.random() * 0.42
        const decay = ember ? 0.16 + Math.random() * 0.14 : 0.04 + Math.random() * 0.07
        // Brightness varies per spark; embers sit lower and warmer.
        crackleHp.frequency.setValueAtTime(
          ember ? 1100 + Math.random() * 500 : 2200 + Math.random() * 1800,
          now,
        )
        // A 4-8ms attack (not an instant jump) keeps each pop click-free, then decays.
        crackleEnv.gain.cancelScheduledValues(now)
        crackleEnv.gain.setValueAtTime(0.0001, now)
        crackleEnv.gain.linearRampToValueAtTime(peak, now + (ember ? 0.008 : 0.004))
        crackleEnv.gain.exponentialRampToValueAtTime(0.0001, now + decay)
        timer = setTimeout(pop, (ember ? 600 : 90) + Math.random() * (ember ? 1200 : 420))
      }
      timer = setTimeout(pop, 300)
      return {
        output: out,
        dispose: () => (safeStop(rumbleSrc), safeStop(crackleSrc), clearTimeout(timer)),
      }
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
