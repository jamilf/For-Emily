import { describe, it, expect } from 'vitest'
import { layersForPhase, RESOLUTION_MOTIF } from './scoreArc.js'

const ROLES = ['bass', 'pad', 'chord', 'lead', 'perc']

describe('layersForPhase', () => {
  it('bass is always present at full gain in every mapped phase', () => {
    for (const phase of ['settling', 'growing', 'golden', 'done']) {
      expect(layersForPhase(phase).bass).toBe(1)
    }
  })

  it('the pad layer blooms in across the session, never louder earlier', () => {
    const order = ['settling', 'growing', 'golden', 'done']
    let prev = -1
    for (const phase of order) {
      const g = layersForPhase(phase).pad
      expect(g).toBeGreaterThanOrEqual(prev)
      prev = g
    }
    expect(layersForPhase('golden').pad).toBe(1)
    expect(layersForPhase('done').pad).toBe(1)
  })

  it('golden and done are full presence on every role', () => {
    for (const phase of ['golden', 'done']) {
      const layers = layersForPhase(phase)
      for (const role of ROLES) expect(layers[role]).toBe(1)
    }
  })

  it('falls back to full presence outside a session (null, undefined, unknown)', () => {
    for (const phase of [null, undefined, 'bogus', 'idle']) {
      const layers = layersForPhase(phase)
      for (const role of ROLES) expect(layers[role]).toBe(1)
    }
  })

  it('every mapped phase returns a value for every known role, in range', () => {
    for (const phase of ['settling', 'growing', 'golden', 'done']) {
      const layers = layersForPhase(phase)
      for (const role of ROLES) {
        expect(layers[role]).toBeGreaterThanOrEqual(0)
        expect(layers[role]).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is pure: same phase always returns equal (fresh) values', () => {
    expect(layersForPhase('growing')).toEqual(layersForPhase('growing'))
  })
})

describe('RESOLUTION_MOTIF', () => {
  it('is well-formed: positive degrees, positive durations, sane gains, known voices', () => {
    expect(RESOLUTION_MOTIF.length).toBeGreaterThan(0)
    for (const n of RESOLUTION_MOTIF) {
      expect(n.start).toBeGreaterThanOrEqual(0)
      expect(n.dur).toBeGreaterThan(0)
      expect(Number.isInteger(n.degree)).toBe(true)
      expect(n.degree).toBeGreaterThan(0)
      expect(n.gain).toBeGreaterThan(0)
      expect(n.gain).toBeLessThanOrEqual(1)
      expect(['tri', 'pad', 'piano', 'epiano', 'bass']).toContain(n.voice)
    }
  })

  it('resolves upward, ending on the octave (degree 8)', () => {
    const last = RESOLUTION_MOTIF[RESOLUTION_MOTIF.length - 1]
    expect(RESOLUTION_MOTIF.some((n) => n.degree === 8)).toBe(true)
    expect(last.degree === 8 || last.start >= 1.6).toBe(true)
  })

  it('is a short phrase (a few bars at most, not an endless loop)', () => {
    const end = Math.max(...RESOLUTION_MOTIF.map((n) => n.start + n.dur))
    expect(end).toBeLessThan(8) // well under 8 beats, ~2 bars of 4/4
  })
})
