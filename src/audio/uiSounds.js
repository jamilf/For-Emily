// Synthesized JRPG menu blips (Web Audio only, no files). Short, soft, band-limited
// chiptune ticks in the cozy genre idiom. These are always OPTIONAL and ADDITIVE:
// the provider only calls them once the shared AudioContext is running (i.e. after
// the user has started audio), so they never autoplay and are never the sole signal.

// kind → a tiny two-point pitch envelope (Hz) + duration (s) + waveform.
const VOICES = {
  cursor: { from: 1180, to: 1180, dur: 0.05, type: 'square' },
  confirm: { from: 740, to: 1180, dur: 0.12, type: 'square' },
  cancel: { from: 620, to: 400, dur: 0.12, type: 'triangle' },
  open: { from: 520, to: 980, dur: 0.14, type: 'triangle' },
  close: { from: 980, to: 520, dur: 0.12, type: 'triangle' },
}

/**
 * Play one UI blip into `dest` at `volume` (0..1). Pure Web Audio; safe no-op on a
 * missing context/kind. Keeps its own short envelope so notes never click.
 * @param {AudioContext} ctx  a RUNNING shared context (caller guarantees state)
 * @param {AudioNode} dest    where to route (e.g. the master gain)
 * @param {string} kind       cursor | confirm | cancel | open | close
 * @param {number} volume     0..1; <=0 plays nothing
 */
export function playBlip(ctx, dest, kind, volume = 0.2) {
  const v = VOICES[kind]
  if (!ctx || !dest || !v || volume <= 0) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = v.type
  osc.frequency.setValueAtTime(v.from, now)
  if (v.to !== v.from) osc.frequency.exponentialRampToValueAtTime(v.to, now + v.dur)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3200 // keep it soft, never harsh

  const env = ctx.createGain()
  const peak = Math.max(0.0001, Math.min(0.5, volume) * 0.5) // gentle ceiling
  env.gain.setValueAtTime(0.0001, now)
  env.gain.linearRampToValueAtTime(peak, now + 0.006)
  env.gain.exponentialRampToValueAtTime(0.0001, now + v.dur)

  osc.connect(lp)
  lp.connect(env)
  env.connect(dest)
  osc.start(now)
  osc.stop(now + v.dur + 0.03)
}
