// Focus-music style presets. Pure data: a key centre + mode, a chord progression
// (one chord per bar, cycled), tempo/feel, the arrangement patterns the generator
// reads, and the synth voices the player uses. No Web Audio here — these are
// consumed by the deterministic generator (planBar) and, for timbre, the player.
//
// Each is an original sketch evoking its genre, never a copy of any specific work.
//
// Chord shape: { degree, size } where degree is the 1-based scale degree the chord
// is rooted on and size is how many diatonic thirds to stack (3 = triad, 4 = 7th,
// 5 = 9th). Stacking stays diatonic to the mode, so the colour (maj7, m7, add9,
// the Lydian #4) falls out of the mode automatically.

/** 'off' is a real, selectable value — the absence of music. */
export const OFF = 'off'

export const STYLES = {
  ghibli: {
    id: 'ghibli',
    label: 'Ghibli',
    tonic: { name: 'C', octave: 4 },
    mode: 'lydian', // the raised 4th gives that wistful, hopeful shimmer
    bpm: 80,
    beatsPerBar: 4,
    swing: 0,
    // Imaj9 - Vmaj7 - vi7 - IVmaj9, a warm diatonic loop
    progression: [
      { degree: 1, size: 5 },
      { degree: 5, size: 4 },
      { degree: 6, size: 4 },
      { degree: 4, size: 5 },
    ],
    bassPattern: 'root',
    chordPattern: 'arp', // a rolling piano arpeggio
    pad: true, // soft sustained strings underneath
    melodyDensity: 0.55,
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'piano', chord: 'piano', bass: 'bass' },
    masterFilter: null,
    crackle: false,
    flutter: false,
  },

  classical: {
    id: 'classical',
    label: 'Classical',
    tonic: { name: 'C', octave: 4 },
    mode: 'major',
    bpm: 84,
    beatsPerBar: 4,
    swing: 0,
    // I - IV - V7 - I, common-practice functional harmony
    progression: [
      { degree: 1, size: 3 },
      { degree: 4, size: 3 },
      { degree: 5, size: 4 },
      { degree: 1, size: 3 },
    ],
    bassPattern: 'alberti', // the classic broken-chord left hand
    chordPattern: 'none', // the Alberti figure is the accompaniment
    pad: false,
    melodyDensity: 0.7,
    octaves: { bass: 3, chord: 4, melody: 5 },
    voices: { lead: 'piano', chord: 'piano', bass: 'piano' },
    masterFilter: null,
    crackle: false,
    flutter: false,
  },

  lofi: {
    id: 'lofi',
    label: 'Lofi',
    tonic: { name: 'A', octave: 3 },
    mode: 'dorian', // mellow minor with a hopeful 6th
    bpm: 74,
    beatsPerBar: 4,
    swing: 0.34, // lazy swung eighths
    // ii7 - V7 - Imaj7 - vi7, the quintessential lofi turnaround
    progression: [
      { degree: 2, size: 4 },
      { degree: 5, size: 4 },
      { degree: 1, size: 5 },
      { degree: 6, size: 4 },
    ],
    bassPattern: 'rootfifth',
    chordPattern: 'stab', // soft off-beat electric-piano stabs
    pad: false,
    melodyDensity: 0.4, // sparse, leaves space
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'epiano', chord: 'epiano', bass: 'bass' },
    masterFilter: { type: 'lowpass', freq: 1900, Q: 0.6 }, // tape warmth
    crackle: true, // vinyl hiss + pops
    flutter: true, // slow wow/flutter detune
  },

  rainpiano: {
    id: 'rainpiano',
    label: 'Rain Piano',
    tonic: { name: 'D', octave: 4 },
    mode: 'minor',
    bpm: 60,
    beatsPerBar: 4,
    swing: 0,
    // i7 - VImaj7 - iv - v, slow and contemplative; sits under rain
    progression: [
      { degree: 1, size: 4 },
      { degree: 6, size: 4 },
      { degree: 4, size: 3 },
      { degree: 5, size: 3 },
    ],
    bassPattern: 'root',
    chordPattern: 'arp',
    pad: false,
    melodyDensity: 0.28, // very sparse, single notes hanging in the air
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'piano', chord: 'piano', bass: 'bass' },
    masterFilter: { type: 'lowpass', freq: 3200, Q: 0.5 },
    crackle: false,
    flutter: false,
  },
}

/** The picker options, in display order, with Off first. */
export const MUSIC_STYLES = [
  { id: OFF, label: 'Off' },
  { id: 'ghibli', label: 'Ghibli' },
  { id: 'classical', label: 'Classical' },
  { id: 'lofi', label: 'Lofi' },
  { id: 'rainpiano', label: 'Rain Piano' },
]

/** Look up a style preset by id, or null for 'off'/unknown. */
export function getStyle(id) {
  return STYLES[id] || null
}
