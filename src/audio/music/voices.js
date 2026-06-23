// Synth voices for the focus-music player. Each schedules a short note into a
// destination node at an absolute context time. Every envelope ramps in and out
// (no instant gain jumps), so notes never click. Web Audio only — not pure, not
// coverage-gated; the musical decisions live in generator.js.

import { pulseCoeffs, dutyOf } from './chiptune.js'

function adsrTail(envGain, t, peak, end) {
  envGain.setValueAtTime(0.0001, t)
  envGain.linearRampToValueAtTime(Math.max(0.0001, peak), t + 0.006) // 6ms attack
  return end
}

/** Soft acoustic-ish piano: triangle body + a quiet octave, percussive decay. */
function piano(ctx, dest, freq, t, dur, gain) {
  const o1 = ctx.createOscillator()
  o1.type = 'triangle'
  o1.frequency.value = freq
  const o2 = ctx.createOscillator()
  o2.type = 'sine'
  o2.frequency.value = freq * 2
  const o2g = ctx.createGain()
  o2g.gain.value = 0.28
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(Math.min(8000, freq * 8), t)
  lp.Q.value = 0.3
  const env = ctx.createGain()
  o1.connect(lp)
  o2.connect(o2g)
  o2g.connect(lp)
  lp.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain)
  const end = t + Math.max(0.3, dur) + 0.7
  adsrTail(env.gain, t, peak, end)
  env.gain.exponentialRampToValueAtTime(peak * 0.3, t + 0.18)
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  lp.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 3), end)
  o1.start(t)
  o2.start(t)
  o1.stop(end + 0.05)
  o2.stop(end + 0.05)
}

/** Mellow electric piano (lofi): detuned pair, gentle, lowpassed. */
function epiano(ctx, dest, freq, t, dur, gain) {
  const o1 = ctx.createOscillator()
  o1.type = 'sine'
  o1.frequency.value = freq
  const o2 = ctx.createOscillator()
  o2.type = 'triangle'
  o2.frequency.value = freq
  o2.detune.value = 8
  const o2g = ctx.createGain()
  o2g.gain.value = 0.5
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(3000, freq * 5)
  const env = ctx.createGain()
  o1.connect(lp)
  o2.connect(o2g)
  o2g.connect(lp)
  lp.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain)
  const end = t + Math.max(0.4, dur) + 0.5
  adsrTail(env.gain, t, peak, end)
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  o1.start(t)
  o2.start(t)
  o1.stop(end + 0.05)
  o2.stop(end + 0.05)
}

/** Warm string pad: stacked detuned saws, slow swell and release. */
function pad(ctx, dest, freq, t, dur, gain) {
  const end = t + dur + 1.2
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(2600, freq * 4)
  lp.Q.value = 0.4
  const env = ctx.createGain()
  lp.connect(env)
  env.connect(dest)
  for (const d of [-6, 6, 0]) {
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = freq
    o.detune.value = d
    const g = ctx.createGain()
    g.gain.value = 0.22
    o.connect(g)
    g.connect(lp)
    o.start(t)
    o.stop(end + 0.05)
  }
  const peak = Math.max(0.0001, gain)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.5) // slow swell
  env.gain.setValueAtTime(peak, Math.max(t + 0.5, end - 0.9))
  env.gain.exponentialRampToValueAtTime(0.0001, end)
}

/** Rounded sub bass: sine with a touch of triangle. */
function bass(ctx, dest, freq, t, dur, gain) {
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = freq
  const o2 = ctx.createOscillator()
  o2.type = 'triangle'
  o2.frequency.value = freq
  const o2g = ctx.createGain()
  o2g.gain.value = 0.22
  const env = ctx.createGain()
  o.connect(env)
  o2.connect(o2g)
  o2g.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain)
  const end = t + dur + 0.25
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.02)
  env.gain.setValueAtTime(peak, Math.max(t + 0.02, end - 0.18))
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  o.start(t)
  o2.start(t)
  o.stop(end + 0.05)
  o2.stop(end + 0.05)
}

// ── Chiptune channels — warm, band-limited, NES-flavoured ──────────────────
// PeriodicWaves are cached per context + duty so we build each pulse table once.
const pulseWaves = new WeakMap()
function pulseWave(ctx, duty) {
  let byDuty = pulseWaves.get(ctx)
  if (!byDuty) {
    byDuty = {}
    pulseWaves.set(ctx, byDuty)
  }
  const key = String(duty)
  if (!byDuty[key]) {
    const { real, imag } = pulseCoeffs(duty, 28)
    byDuty[key] = ctx.createPeriodicWave(real, imag)
  }
  return byDuty[key]
}

/** A warm pulse voice (selectable duty) with a touch of vibrato + lowpass. */
function pulse(ctx, dest, freq, t, dur, gain, duty) {
  const o = ctx.createOscillator()
  o.setPeriodicWave(pulseWave(ctx, duty))
  o.frequency.value = freq
  // gentle vibrato for a hand-played feel
  const vib = ctx.createOscillator()
  vib.type = 'sine'
  vib.frequency.value = 5.2
  const vibg = ctx.createGain()
  vibg.gain.value = freq * 0.004
  vib.connect(vibg)
  vibg.connect(o.frequency)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(4200, freq * 6)
  const env = ctx.createGain()
  o.connect(lp)
  lp.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain * 0.5) // pulses are bright; keep them gentle
  const end = t + Math.max(0.25, dur) + 0.3
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.008)
  env.gain.setValueAtTime(peak, Math.max(t + 0.008, end - 0.12))
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  o.start(t)
  vib.start(t)
  o.stop(end + 0.05)
  vib.stop(end + 0.05)
}

/** Mellow triangle (chip lead/bass), soft and rounded. */
function tri(ctx, dest, freq, t, dur, gain) {
  const o = ctx.createOscillator()
  o.type = 'triangle'
  o.frequency.value = freq
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(3000, freq * 5)
  const env = ctx.createGain()
  o.connect(lp)
  lp.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain)
  const end = t + dur + 0.3
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.01)
  env.gain.setValueAtTime(peak, Math.max(t + 0.01, end - 0.15))
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  o.start(t)
  o.stop(end + 0.05)
}

/** A soft, short filtered noise burst — minimal percussion. */
function noise(ctx, dest, freq, t, dur, gain) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = Math.min(6000, Math.max(800, freq * 2))
  bp.Q.value = 0.7
  const env = ctx.createGain()
  src.connect(bp)
  bp.connect(env)
  env.connect(dest)
  const peak = Math.max(0.0001, gain * 0.4)
  const end = t + 0.08
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.003)
  env.gain.exponentialRampToValueAtTime(0.0001, end)
  src.start(t)
  src.stop(end + 0.02)
}

const VOICES = { piano, epiano, pad, bass, tri }

/** Trigger a named voice; pulse12/25/50 and noise are chiptune, else fall back. */
export function triggerVoice(ctx, dest, name, freq, t, dur, gain) {
  const duty = dutyOf(name)
  if (duty != null) return pulse(ctx, dest, freq, t, dur, gain, duty)
  if (name === 'noise') return noise(ctx, dest, freq, t, dur, gain)
  ;(VOICES[name] || piano)(ctx, dest, freq, t, dur, gain)
}

/**
 * A vinyl bed for lofi: continuous high hiss plus random surface pops. Returns a
 * dispose fn. Connects into `dest` (typically behind the master lowpass for warmth).
 */
export function createCrackle(ctx, dest) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  const hiss = ctx.createBufferSource()
  hiss.buffer = buf
  hiss.loop = true
  const hissHp = ctx.createBiquadFilter()
  hissHp.type = 'highpass'
  hissHp.frequency.value = 1000
  const hissG = ctx.createGain()
  hissG.gain.value = 0.014
  hiss.connect(hissHp)
  hissHp.connect(hissG)
  hissG.connect(dest)
  hiss.start()

  const pops = ctx.createBufferSource()
  pops.buffer = buf
  pops.loop = true
  const popHp = ctx.createBiquadFilter()
  popHp.type = 'highpass'
  popHp.frequency.value = 3000
  const popG = ctx.createGain()
  popG.gain.value = 0.0001
  pops.connect(popHp)
  popHp.connect(popG)
  popG.connect(dest)
  pops.start()

  let timer = null
  const pop = () => {
    const now = ctx.currentTime
    const peak = 0.04 + Math.random() * 0.08
    popG.gain.cancelScheduledValues(now)
    popG.gain.setValueAtTime(0.0001, now)
    popG.gain.linearRampToValueAtTime(peak, now + 0.004)
    popG.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
    timer = setTimeout(pop, 200 + Math.random() * 900)
  }
  timer = setTimeout(pop, 400)

  return () => {
    try {
      hiss.stop()
    } catch {
      /* already stopped */
    }
    try {
      pops.stop()
    } catch {
      /* already stopped */
    }
    clearTimeout(timer)
  }
}
