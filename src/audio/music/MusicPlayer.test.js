import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MusicPlayer from './MusicPlayer.js'

// A tiny offline AudioContext mock: it records the nodes it makes and every
// connect/disconnect, so we can assert the player wires + tears down correctly
// without ever opening real audio hardware (impossible + undesirable in jsdom).
function audioParam(initial = 0) {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
}

function node(kind, extra = {}) {
  return { kind, connect: vi.fn(), disconnect: vi.fn(), ...extra }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.sampleRate = 44100
    this.destination = node('destination')
    this.created = []
  }
  _t(n) {
    this.created.push(n)
    return n
  }
  ofKind(kind) {
    return this.created.filter((n) => n.kind === kind)
  }
  createGain() {
    return this._t(node('gain', { gain: audioParam(1) }))
  }
  createBiquadFilter() {
    return this._t(node('biquad', { type: 'lowpass', frequency: audioParam(350), Q: audioParam(1) }))
  }
  createConvolver() {
    return this._t(node('convolver', { buffer: null }))
  }
  createDelay() {
    return this._t(node('delay', { delayTime: audioParam(0) }))
  }
  createOscillator() {
    return this._t(
      node('osc', {
        type: 'sine',
        frequency: audioParam(440),
        detune: audioParam(0),
        start: vi.fn(),
        stop: vi.fn(),
        setPeriodicWave: vi.fn(),
      }),
    )
  }
  createBufferSource() {
    return this._t(node('bufsrc', { buffer: null, loop: false, start: vi.fn(), stop: vi.fn() }))
  }
  createPeriodicWave() {
    return { _periodicWave: true }
  }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length))
    return { numberOfChannels: channels, length, getChannelData: (c) => data[c] }
  }
}

describe('MusicPlayer — wiring with a mocked AudioContext', () => {
  let ctx
  let dest

  beforeEach(() => {
    ctx = new MockAudioContext()
    dest = ctx.createGain()
    ctx.created.length = 0 // ignore the destination gain in assertions
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds its bus + FX nodes on construction but stays silent (no voices, gain 0)', () => {
    const p = new MusicPlayer(ctx, dest)
    // The output starts fully closed — nothing audible before a gesture/start.
    expect(p.out.gain.value).toBe(0)
    // Construction wires reverb + delay FX, but plays no notes yet.
    expect(ctx.ofKind('convolver').length).toBe(1)
    expect(ctx.ofKind('delay').length).toBe(1)
    expect(ctx.ofKind('osc').length).toBe(0)
    expect(ctx.ofKind('bufsrc').length).toBe(0)
    // out routes through the entrainment stage to the destination.
    expect(p.out.connect).toHaveBeenCalledWith(p.entGain)
    expect(p.entGain.connect).toHaveBeenCalledWith(dest)
  })

  it('setStyle swaps the chain after the dip and schedules voices off the clock', () => {
    vi.useFakeTimers()
    const p = new MusicPlayer(ctx, dest)
    p.setStyle('latenight')
    expect(p.styleId).toBe('latenight')
    // The swap is deferred ~180ms to dip first; advance past it + a scheduler tick.
    vi.advanceTimersByTime(260)
    expect(p.style).toBeTruthy()
    expect(p.timer).not.toBeNull()
    // A bar got scheduled → real voices (oscillators) were created.
    expect(ctx.ofKind('osc').length).toBeGreaterThan(0)
    p.stop()
  })

  it('an unknown / off style stops rather than throwing', () => {
    const p = new MusicPlayer(ctx, dest)
    p.setStyle('off')
    expect(p.timer).toBeNull()
    expect(p.style).toBeNull()
  })

  it('focus ducks the target volume and is restored on release', () => {
    const p = new MusicPlayer(ctx, dest)
    p.setVolume(0.6)
    expect(p._targetVol()).toBeCloseTo(0.6, 5)
    p.setFocus(true)
    expect(p.focus).toBe(true)
    expect(p._targetVol()).toBeCloseTo(0.3, 5)
    p.setFocus(false)
    expect(p._targetVol()).toBeCloseTo(0.6, 5)
  })

  it('entrainment adds a ~10Hz LFO and fully removes it when turned off', () => {
    const p = new MusicPlayer(ctx, dest)
    p.setEntrainment(true)
    expect(p.entLfo).toBeTruthy()
    const lfo = ctx.ofKind('osc').find((o) => o.frequency.value === 10)
    expect(lfo).toBeTruthy()
    expect(lfo.start).toHaveBeenCalled()
    p.setEntrainment(false)
    expect(p.entLfo).toBeNull()
    expect(lfo.stop).toHaveBeenCalled()
  })

  it('stop clears the scheduler and fades out; dispose disconnects the bus', () => {
    vi.useFakeTimers()
    const p = new MusicPlayer(ctx, dest)
    p.setStyle('momentum')
    vi.advanceTimersByTime(260)
    expect(p.timer).not.toBeNull()
    p.stop()
    expect(p.timer).toBeNull()
    expect(p.out.gain.setTargetAtTime).toHaveBeenCalled()
    p.dispose()
    expect(p.out.disconnect).toHaveBeenCalled()
    expect(p.entGain.disconnect).toHaveBeenCalled()
  })
})
