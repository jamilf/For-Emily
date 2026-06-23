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

export default class MusicPlayer {
  constructor(ctx, destination) {
    this.ctx = ctx
    this.destination = destination
    this.out = ctx.createGain()
    this.out.gain.value = 0
    this.out.connect(destination)
    this.busIn = ctx.createGain()
    this.busIn.gain.value = 1
    this.filterNode = null
    this._connectBus(null)

    this.styleId = 'off'
    this.style = null
    this.seed = (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0
    this.bar = 0
    this.nextBarTime = 0
    this.timer = null
    this.crackleDispose = null
    this.volume = 0.6
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
      this._stopCrackle()
      if (style.crackle) this.crackleDispose = createCrackle(this.ctx, this.busIn)
      this._run()
      const t = this.ctx.currentTime
      this.out.gain.cancelScheduledValues(t)
      this.out.gain.setTargetAtTime(this.volume, t, 0.25)
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
    this.out.gain.setTargetAtTime(this.volume, t, 0.3)
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
      triggerVoice(ctx, this.busIn, e.voice, e.freq * wow, t0 + e.start * beat, e.dur * beat, e.gain)
    }
  }

  setVolume(v) {
    this.volume = v
    if (this.timer) {
      const t = this.ctx.currentTime
      this.out.gain.cancelScheduledValues(t)
      this.out.gain.setTargetAtTime(Math.max(0.0001, v), t, 0.1)
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
    try {
      this.out.disconnect()
    } catch {
      /* ignore */
    }
  }
}
