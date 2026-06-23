// Music theory — the PURE, deterministic core the focus-music generator is built
// on. No Web Audio, no randomness except a seeded RNG, so every function here is
// unit-testable and reproducible. Frequencies use equal temperament with A4 = 440.

/** A tiny, fast, seedable PRNG (mulberry32). Returns a function in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Semitone offsets from the tonic for the modes the styles use.
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10], // natural minor (Aeolian)
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

// Pitch class of each note name (C = 0). Both sharps and flats resolve.
const PITCH_CLASS = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

/** MIDI note number for a key name + octave (e.g. "C", 4 → 60). */
export function midiOf(name, octave) {
  const pc = PITCH_CLASS[name]
  if (pc == null) throw new Error(`unknown note name: ${name}`)
  return (octave + 1) * 12 + pc
}

/** Frequency (Hz) of a MIDI note. A4 = MIDI 69 = 440 Hz. */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * The MIDI note for a scale degree (1-based) in a given mode, relative to a tonic
 * MIDI note. Degrees beyond the scale wrap into higher octaves, and degree offsets
 * may be negative to reach below the tonic, so melodies can roam freely in key.
 */
export function degreeToMidi(tonicMidi, mode, degree) {
  const steps = SCALES[mode]
  if (!steps) throw new Error(`unknown mode: ${mode}`)
  const i = degree - 1
  const len = steps.length
  const octave = Math.floor(i / len)
  const within = ((i % len) + len) % len
  return tonicMidi + octave * 12 + steps[within]
}

/**
 * Build a chord as scale degrees stacked in thirds from a root degree. `size` 3 is
 * a triad, 4 a seventh, 5 a ninth. Returns the chord's scale degrees (1-based,
 * possibly > 7 for the upper extensions), so the voicing stays diatonic to `mode`.
 */
export function chordDegrees(rootDegree, size = 3) {
  const out = []
  for (let i = 0; i < size; i++) out.push(rootDegree + i * 2)
  return out
}

/**
 * Voice a chord (given as scale degrees) into MIDI notes that sit at or above a
 * floor MIDI note, keeping the stack compact. Deterministic.
 */
export function voiceChord(tonicMidi, mode, degrees, floorMidi) {
  return degrees.map((d) => {
    let m = degreeToMidi(tonicMidi, mode, d)
    while (m < floorMidi) m += 12
    return m
  })
}

/** Clamp a MIDI note into [lo, hi] by octave shifts, preserving pitch class. */
export function foldIntoRange(midi, lo, hi) {
  let m = midi
  while (m < lo) m += 12
  while (m > hi) m -= 12
  return m
}
