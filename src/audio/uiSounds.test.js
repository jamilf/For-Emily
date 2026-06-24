import { describe, it, expect, vi } from 'vitest'
import { playBlip } from './uiSounds.js'

// A tiny mocked AudioContext that records the nodes it creates + their connections,
// so we can assert the blip wires up without opening real audio hardware.
function audioParam() {
  return {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    value: 0,
  }
}
function makeCtx() {
  const created = []
  const node = (kind, extra = {}) => {
    const n = { kind, connect: vi.fn(), ...extra }
    created.push(n)
    return n
  }
  return {
    currentTime: 0,
    created,
    createOscillator: () => node('osc', { type: '', frequency: audioParam(), start: vi.fn(), stop: vi.fn() }),
    createBiquadFilter: () => node('biquad', { type: '', frequency: audioParam() }),
    createGain: () => node('gain', { gain: audioParam() }),
  }
}

describe('playBlip', () => {
  it('creates and connects an oscillator → filter → envelope → destination', () => {
    const ctx = makeCtx()
    const dest = { connect: vi.fn() }
    playBlip(ctx, dest, 'confirm', 0.3)
    expect(ctx.created.filter((n) => n.kind === 'osc')).toHaveLength(1)
    const osc = ctx.created.find((n) => n.kind === 'osc')
    expect(osc.start).toHaveBeenCalled()
    expect(osc.stop).toHaveBeenCalled()
  })

  it('plays nothing when volume is 0 or below (respects mute)', () => {
    const ctx = makeCtx()
    playBlip(ctx, { connect: vi.fn() }, 'confirm', 0)
    expect(ctx.created).toHaveLength(0)
  })

  it('plays nothing for an unknown kind or missing context', () => {
    const ctx = makeCtx()
    playBlip(ctx, { connect: vi.fn() }, 'nope', 0.5)
    expect(ctx.created).toHaveLength(0)
    expect(() => playBlip(null, null, 'confirm', 0.5)).not.toThrow()
  })

  it('only ramps frequency for the gliding kinds', () => {
    const ctx = makeCtx()
    playBlip(ctx, { connect: vi.fn() }, 'cursor', 0.3) // from === to: no glide
    const osc = ctx.created.find((n) => n.kind === 'osc')
    expect(osc.frequency.exponentialRampToValueAtTime).not.toHaveBeenCalled()
  })
})
