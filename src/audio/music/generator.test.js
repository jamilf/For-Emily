import { describe, it, expect } from 'vitest'
import { planBar, secondsPerBeat } from './generator.js'
import { STYLES } from './styles.js'
import { SCALES, midiOf, degreeToMidi, chordDegrees } from './theory.js'

const ALL = Object.values(STYLES)
const VOICES = new Set(['piano', 'epiano', 'pad', 'bass'])
const SEED = 0x1234

function scalePitchClasses(style) {
  const tonicPc = midiOf(style.tonic.name, style.tonic.octave) % 12
  return new Set(SCALES[style.mode].map((s) => (tonicPc + s) % 12))
}

function chordPitchClasses(style, barIndex) {
  const tonicMidi = midiOf(style.tonic.name, style.tonic.octave)
  const chord = style.progression[barIndex % style.progression.length]
  return new Set(
    chordDegrees(chord.degree, chord.size).map((d) => degreeToMidi(tonicMidi, style.mode, d) % 12),
  )
}

describe('planBar — deterministic, well-formed events', () => {
  for (const style of ALL) {
    it(`${style.id}: identical inputs yield identical output`, () => {
      expect(planBar(style, SEED, 3)).toEqual(planBar(style, SEED, 3))
    })

    it(`${style.id}: events are sorted, in-bar, and structurally valid`, () => {
      for (let bar = 0; bar < 8; bar++) {
        const events = planBar(style, SEED, bar)
        expect(events.length).toBeGreaterThan(0)
        let prev = -1
        for (const e of events) {
          expect(e.start).toBeGreaterThanOrEqual(0)
          expect(e.start).toBeLessThan(style.beatsPerBar)
          expect(e.start).toBeGreaterThanOrEqual(prev) // sorted
          prev = e.start
          expect(e.dur).toBeGreaterThan(0)
          expect(e.gain).toBeGreaterThan(0)
          expect(e.gain).toBeLessThanOrEqual(1)
          expect(e.freq).toBeGreaterThan(0)
          expect(VOICES.has(e.voice)).toBe(true)
        }
      }
    })

    it(`${style.id}: every note stays in key (accompaniment stays on chord tones)`, () => {
      const scale = scalePitchClasses(style)
      for (let bar = 0; bar < 8; bar++) {
        const chordTones = chordPitchClasses(style, bar)
        for (const e of planBar(style, SEED, bar)) {
          const pc = ((e.midi % 12) + 12) % 12
          expect(scale.has(pc), `${style.id} bar ${bar}: ${pc} out of scale`).toBe(true)
          if (e.voice !== style.voices.lead) {
            // bass / arp / pad / stab are voiced from chord tones
            expect(chordTones.has(pc), `${style.id} bar ${bar}: ${pc} not a chord tone`).toBe(true)
          }
        }
      }
    })

    it(`${style.id}: the music evolves bar to bar`, () => {
      expect(planBar(style, SEED, 0)).not.toEqual(planBar(style, SEED, 1))
    })

    it(`${style.id}: secondsPerBeat tracks the tempo`, () => {
      expect(secondsPerBeat(style)).toBeCloseTo(60 / style.bpm, 6)
    })
  }
})

describe('swing feel', () => {
  const onGrid = (s) => Math.abs(s / 0.5 - Math.round(s / 0.5)) < 1e-9

  it('straight styles place every note on the eighth grid', () => {
    for (const id of ['ghibli', 'classical', 'rainpiano']) {
      const style = STYLES[id]
      expect(style.swing).toBe(0)
      for (let bar = 0; bar < 4; bar++) {
        for (const e of planBar(style, SEED, bar)) expect(onGrid(e.start)).toBe(true)
      }
    }
  })

  it('lofi swings its off-beats (some notes land off the straight grid)', () => {
    const style = STYLES.lofi
    expect(style.swing).toBeGreaterThan(0)
    let offGrid = 0
    for (let bar = 0; bar < 8; bar++) {
      for (const e of planBar(style, SEED, bar)) if (!onGrid(e.start)) offGrid++
    }
    expect(offGrid).toBeGreaterThan(0)
  })
})

describe('octave placement', () => {
  it('keeps every note in a sane instrument range', () => {
    const lo = midiOf('C', 1)
    const hi = midiOf('C', 7)
    for (const style of ALL) {
      for (let bar = 0; bar < 4; bar++) {
        for (const e of planBar(style, SEED, bar)) {
          expect(e.midi).toBeGreaterThanOrEqual(lo)
          expect(e.midi).toBeLessThanOrEqual(hi)
        }
      }
    }
  })

  it('reaches up into the melody register over a phrase', () => {
    // The lead/chord/bass timbres overlap, so melody can't be isolated by voice;
    // instead confirm the generator does place notes up in the melody octave.
    for (const style of ALL) {
      const floor = midiOf('C', style.octaves.melody)
      let high = 0
      for (let bar = 0; bar < 8; bar++) {
        for (const e of planBar(style, SEED, bar)) if (e.midi >= floor) high++
      }
      expect(high, `${style.id} never reaches the melody octave`).toBeGreaterThan(0)
    }
  })
})
