// The focus-music playback engine. A standard look-ahead scheduler ("two clocks"):
// a coarse setInterval wakes up often and schedules every bar whose start falls
// within the next LOOKAHEAD window using the precise AudioContext clock, so timing
// is sample-accurate and jitter-free. It plans bars one at a time via the pure
// generator, so the music evolves and never audibly loops.
//
// Web Audio only; constructed lazily on the shared running context, never in tests.

import { getStyle } from './styles.js'
import { planBar, secondsPerBeat } from './generator.js'
import { triggerVoice, createCrackle } from './voices.js'

const LOOKAHEAD = 0.1 // schedule this far ahead, in seconds
const TICK = 25 // scheduler wake interval, in ms

// A procedural reverb impulse: decaying stereo noise. No audio files.
function makeImpulse(ctx, seconds, decay) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

export default class MusicPlayer {
  constructor(ctx, destination) {
    this.ctx = ctx
    this.destination = destination
    this.out = ctx.createGain()
    this.out.gain.value = 0

    // Entrainment stage: out -> entGain -> destination. entGain is amplitude-
    // modulated by a ~10Hz LFO only while the opt-in toggle is on (off by default).
    this.entGain = ctx.createGain()
    this.entGain.gain.value = 1
    this.out.connect(this.entGain)
    this.entGain.connect(destination)
    this.entLfo = null

    this.busIn = ctx.createGain()
    this.busIn.gain.value = 1
    this.filterNode = null

    // FX send (music only): a procedural reverb + a short feedback delay, fed from
    // busIn at an amount set per mood, summed back into `out` for late-night depth.
    this.fxSend = ctx.createGain()
    this.fxSend.gain.value = 0
    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx, 2.4, 2.6)
    const delay = ctx.createDelay(0.6)
    delay.delayTime.value = 0.26
    const fb = ctx.createGain()
    fb.gain.value = 0.28
    delay.connect(fb)
    fb.connect(delay)
    this.fxSend.connect(reverb)
    reverb.connect(this.out)
    this.fxSend.connect(delay)
    delay.connect(this.out)

    this._connectBus(null)

    this.styleId = 'off'
    this.style = null
    this.seed = (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0
    this.bar = 0
    this.nextBarTime = 0
    this.timer = null
    this.crackleDispose = null
    this.volume = 0.6
    this.focus = false
  }

  // The volume to ride to, gently dipped while a deep-focus session is active.
  _targetVol() {
    return Math.max(0.0001, this.volume * (this.focus ? 0.5 : 1))
  }

  // busIn -> [optional master filter] -> out -> destination
  _connectBus(style) {
    try {
      this.busIn.disconnect()
    } catch {
      /* not connected yet */
    }
    if (this.filterNode) {
      try {
        this.filterNode.disconnect()
      } catch {
        /* ignore */
      }
      this.filterNode = null
    }
    if (style && style.masterFilter) {
      const f = this.ctx.createBiquadFilter()
      f.type = style.masterFilter.type
      f.frequency.value = style.masterFilter.freq
      if (style.masterFilter.Q) f.Q.value = style.masterFilter.Q
      this.busIn.connect(f)
      f.connect(this.out)
      this.filterNode = f
    } else {
      this.busIn.connect(this.out)
    }
    // Re-tap the FX send (busIn.disconnect() above dropped it).
    if (this.fxSend) this.busIn.connect(this.fxSend)
  }

  _stopCrackle() {
    if (this.crackleDispose) {
      this.crackleDispose()
      this.crackleDispose = null
    }
  }

  setStyle(id) {
    if (id === this.styleId) return
    this.styleId = id
    const style = getStyle(id)
    if (!style) {
      this.stop()
      return
    }
    // Quick dip, then swap the chain and resume — avoids a click on switch.
    const now = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(now)
    this.out.gain.setTargetAtTime(0.0001, now, 0.05)
    setTimeout(() => {
      if (this.styleId !== id) return
      this.style = style
      this.bar = 0
      this.nextBarTime = this.ctx.currentTime + 0.06
      this._connectBus(style)
      this.fxSend.gain.setTargetAtTime(style.fx || 0, this.ctx.currentTime, 0.1)
      this._stopCrackle()
      if (style.crackle) this.crackleDispose = createCrackle(this.ctx, this.busIn)
      this._run()
      const t = this.ctx.currentTime
      this.out.gain.cancelScheduledValues(t)
      this.out.gain.setTargetAtTime(this._targetVol(), t, 0.25)
    }, 180)
  }

  start() {
    if (!this.style || this.styleId === 'off') return
    this.nextBarTime = this.ctx.currentTime + 0.06
    if (this.style.crackle && !this.crackleDispose) {
      this.crackleDispose = createCrackle(this.ctx, this.busIn)
    }
    this._run()
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setTargetAtTime(this._targetVol(), t, 0.3)
  }

  _run() {
    if (this.timer) return
    this.timer = setInterval(() => this._tick(), TICK)
  }

  _tick() {
    if (!this.style) return
    const ctx = this.ctx
    const beat = secondsPerBeat(this.style)
    const barLen = this.style.beatsPerBar * beat
    while (this.nextBarTime < ctx.currentTime + LOOKAHEAD) {
      this._scheduleBar(this.bar, this.nextBarTime)
      this.nextBarTime += barLen
      this.bar++
    }
  }

  _scheduleBar(barIndex, t0) {
    const ctx = this.ctx
    const beat = secondsPerBeat(this.style)
    const events = planBar(this.style, this.seed, barIndex)
    const wow = this.style.flutter ? Math.pow(2, (Math.sin(t0 * 0.6) * 5) / 1200) : 1
    for (const e of events) {
      // During a deep-focus session, thin the music: drop the melody + percussion,
      // keeping the calm bass/chord/pad bed (it also ducks, in setFocus).
      if (this.focus && (e.role === 'lead' || e.voice === 'noise')) continue
      triggerVoice(ctx, this.busIn, e.voice, e.freq * wow, t0 + e.start * beat, e.dur * beat, e.gain)
    }
  }

  setVolume(v) {
    this.volume = v
    if (this.timer) {
      const t = this.ctx.currentTime
      this.out.gain.cancelScheduledValues(t)
      this.out.gain.setTargetAtTime(this._targetVol(), t, 0.1)
    }
  }

  /** Gently duck + simplify while a deep-focus session is active. */
  setFocus(active) {
    if (this.focus === active) return
    this.focus = active
    if (!this.timer) return
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setTargetAtTime(this._targetVol(), t, 0.6)
  }

  /**
   * Opt-in, experimental entrainment: a faint ~10Hz amplitude wobble on the music
   * bus. Honest framing — it may do nothing. Off by default; fully removable.
   */
  setEntrainment(on) {
    if (on && !this.entLfo) {
      const lfo = this.ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 10
      const depth = this.ctx.createGain()
      depth.gain.value = 0.06
      lfo.connect(depth)
      depth.connect(this.entGain.gain)
      lfo.start()
      this.entLfo = { lfo, depth }
    } else if (!on && this.entLfo) {
      try {
        this.entLfo.lfo.stop()
      } catch {
        /* already stopped */
      }
      try {
        this.entLfo.depth.disconnect()
      } catch {
        /* ignore */
      }
      this.entLfo = null
      const t = this.ctx.currentTime
      this.entGain.gain.cancelScheduledValues(t)
      this.entGain.gain.setValueAtTime(1, t)
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setTargetAtTime(0.0001, t, 0.18)
    this._stopCrackle()
  }

  dispose() {
    this.stop()
    this.setEntrainment(false)
    try {
      this.out.disconnect()
    } catch {
      /* ignore */
    }
    try {
      this.entGain.disconnect()
    } catch {
      /* ignore */
    }
  }
}
