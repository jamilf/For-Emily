import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  midiOf,
  midiToFreq,
  degreeToMidi,
  chordDegrees,
  voiceChord,
  foldIntoRange,
  SCALES,
} from './theory.js'

describe('mulberry32 — seeded RNG', () => {
  it('is deterministic for a seed and varies across seeds', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true)
    const c = mulberry32(99)
    expect([c(), c(), c()]).not.toEqual(seqA.slice(0, 3))
  })
})

describe('pitch math — equal temperament, A4 = 440', () => {
  it('maps note names + octaves to MIDI', () => {
    expect(midiOf('A', 4)).toBe(69)
    expect(midiOf('C', 4)).toBe(60)
    expect(midiOf('C', 5)).toBe(72)
    expect(midiOf('Bb', 3)).toBe(58)
  })

  it('converts MIDI to frequency, doubling each octave', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5)
    expect(midiToFreq(81)).toBeCloseTo(880, 5)
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3)
  })

  it('throws on an unknown note name', () => {
    expect(() => midiOf('H', 4)).toThrow()
  })
})

describe('scales + degrees', () => {
  it('exposes the expected modes', () => {
    expect(SCALES.major).toEqual([0, 2, 4, 5, 7, 9, 11])
    expect(SCALES.lydian[3]).toBe(6) // the raised 4th
    expect(SCALES.dorian[5]).toBe(9) // the raised 6th
  })

  it('resolves scale degrees, wrapping octaves up and down', () => {
    const C4 = midiOf('C', 4)
    expect(degreeToMidi(C4, 'major', 1)).toBe(60) // tonic
    expect(degreeToMidi(C4, 'major', 8)).toBe(72) // octave up
    expect(degreeToMidi(C4, 'major', 2)).toBe(62)
    expect(degreeToMidi(C4, 'major', 0)).toBe(59) // a step below the tonic (B3)
  })

  it('throws on an unknown mode', () => {
    expect(() => degreeToMidi(60, 'phrygian', 1)).toThrow()
  })
})

describe('chords', () => {
  it('stacks diatonic thirds: triad, seventh, ninth', () => {
    expect(chordDegrees(1, 3)).toEqual([1, 3, 5])
    expect(chordDegrees(2, 4)).toEqual([2, 4, 6, 8])
    expect(chordDegrees(1, 5)).toEqual([1, 3, 5, 7, 9])
  })

  it('voices a chord at or above a floor, staying diatonic', () => {
    const C4 = midiOf('C', 4)
    const floor = midiOf('C', 4)
    const voiced = voiceChord(C4, 'major', [1, 3, 5], floor)
    expect(voiced).toEqual([60, 64, 67]) // C E G
    expect(voiced.every((m) => m >= floor)).toBe(true)
  })
})

describe('foldIntoRange', () => {
  it('octave-shifts a note into [lo, hi], preserving pitch class', () => {
    expect(foldIntoRange(48, 60, 72)).toBe(60) // C3 -> C4
    expect(foldIntoRange(84, 60, 72)).toBe(72) // C6 -> C5
    const m = foldIntoRange(50, 60, 72) // D3 -> D4
    expect(m % 12).toBe(2)
    expect(m).toBeGreaterThanOrEqual(60)
    expect(m).toBeLessThanOrEqual(72)
  })
})
