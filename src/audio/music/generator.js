// The generative core — PURE and deterministic. `planBar` turns a style preset,
// a seed, and a bar index into a list of note events for that one bar. No Web
// Audio, no Date, no Math.random: identical inputs always yield identical output,
// which is what makes it unit-testable. The player (voices/MusicPlayer) turns
// these events into sound; this file decides only WHAT is played, never HOW.
//
// A NoteEvent is { start, dur, midi, freq, gain, voice } with start/dur in BEATS
// (the player scales by 60/bpm). `voice` is one of 'piano' | 'epiano' | 'pad' |
// 'bass' and maps to a synth voice in voices.js.

import {
  mulberry32,
  midiOf,
  midiToFreq,
  degreeToMidi,
  chordDegrees,
  voiceChord,
  foldIntoRange,
} from './theory.js'

const EIGHTH = 0.5 // an eighth note, in beats

/** Deterministic per-bar RNG from (seed, barIndex). */
function barRng(seed, barIndex) {
  const h = (Math.imul(seed >>> 0, 2246822519) ^ Math.imul(barIndex + 1, 2654435761)) >>> 0
  return mulberry32(h)
}

/** Swung position (in beats) for an eighth-grid index — off-beats lean late. */
function swung(eighthIndex, swing) {
  return eighthIndex * EIGHTH + (eighthIndex % 2 === 1 ? swing * EIGHTH : 0)
}

/**
 * Plan a single bar. Returns NoteEvents sorted by start time. Pure.
 * @param {object} style  a preset from styles.js (not 'off')
 * @param {number} seed   uint32 session seed
 * @param {number} barIndex  0-based bar counter
 */
export function planBar(style, seed, barIndex) {
  const rng = barRng(seed, barIndex)
  const { mode, beatsPerBar, swing, progression, octaves, voices } = style
  const tonicMidi = midiOf(style.tonic.name, style.tonic.octave)
  const chord = progression[barIndex % progression.length]
  const degrees = chordDegrees(chord.degree, chord.size)

  const chordFloor = midiOf('C', octaves.chord)
  const voiced = voiceChord(tonicMidi, mode, degrees, chordFloor)
  const bassFloor = midiOf('C', octaves.bass)
  const melodyFloor = midiOf('C', octaves.melody)

  const events = []
  const hum = (g) => Math.min(1, g * (0.85 + 0.3 * rng()))
  const push = (start, dur, midi, gain, voice) => {
    if (start < 0 || start >= beatsPerBar) return
    events.push({ start, dur, midi, freq: midiToFreq(midi), gain, voice })
  }

  // ---- bass --------------------------------------------------------------
  const rootMidi = foldIntoRange(degreeToMidi(tonicMidi, mode, chord.degree), bassFloor, bassFloor + 11)
  if (style.bassPattern === 'root') {
    push(0, beatsPerBar, rootMidi, hum(0.5), voices.bass)
  } else if (style.bassPattern === 'rootfifth') {
    const fifth = foldIntoRange(degreeToMidi(tonicMidi, mode, chord.degree + 4), bassFloor, bassFloor + 11)
    push(0, beatsPerBar / 2, rootMidi, hum(0.5), voices.bass)
    push(beatsPerBar / 2, beatsPerBar / 2, fifth, hum(0.42), voices.bass)
  } else if (style.bassPattern === 'alberti') {
    // The classic broken-chord left hand: low, high, middle, high.
    const triad = voiceChord(tonicMidi, mode, chordDegrees(chord.degree, 3), bassFloor)
    const order = [0, 2, 1, 2]
    for (let k = 0; k < beatsPerBar * 2; k++) {
      push(k * EIGHTH, EIGHTH * 0.95, triad[order[k % 4]], hum(0.32), voices.bass)
    }
  }

  // ---- chord layer -------------------------------------------------------
  if (style.pad) {
    for (const m of voiced) push(0, beatsPerBar, m, hum(0.16), 'pad')
  }
  if (style.chordPattern === 'arp') {
    // Quarter-note roll for slow styles, eighth-note roll otherwise.
    const stepBeats = style.bpm <= 66 ? 1 : EIGHTH
    const nSteps = Math.round(beatsPerBar / stepBeats)
    const includeP = 0.55 + style.melodyDensity * 0.45
    for (let k = 0; k < nSteps; k++) {
      if (rng() > includeP) continue
      const ti = k % voiced.length
      const oct = Math.floor(k / voiced.length)
      const start = swung(Math.round((k * stepBeats) / EIGHTH), swing)
      push(start, stepBeats * 0.9, voiced[ti] + oct * 12, hum(0.26), voices.chord)
    }
  } else if (style.chordPattern === 'stab') {
    // Soft electric-piano chords on beats 2 and 4, plus an occasional syncopation.
    for (const pos of [2, 6]) {
      for (const m of voiced) push(swung(pos, swing), beatsPerBar / 4, m, hum(0.22), voices.chord)
    }
    if (rng() < 0.5) {
      for (const m of voiced) push(swung(7, swing), EIGHTH, m, hum(0.16), voices.chord)
    }
  }

  // ---- melody ------------------------------------------------------------
  for (let p = 0; p < beatsPerBar * 2; p++) {
    if (rng() > style.melodyDensity) continue
    let midi
    if (rng() < 0.72) {
      // a chord tone, lifted into the melody octave
      const pick = voiced[Math.floor(rng() * voiced.length)]
      midi = foldIntoRange(pick, melodyFloor, melodyFloor + 12)
    } else {
      // a diatonic passing tone (still in scale)
      const deg = 1 + Math.floor(rng() * 7)
      midi = foldIntoRange(degreeToMidi(tonicMidi, mode, deg), melodyFloor, melodyFloor + 12)
    }
    push(swung(p, swing), EIGHTH * 0.9, midi, hum(0.32), voices.lead)
  }

  events.sort((a, b) => a.start - b.start)
  return events
}

/** Seconds per beat for a style's tempo (the player's beats→time scale). */
export function secondsPerBeat(style) {
  return 60 / style.bpm
}
