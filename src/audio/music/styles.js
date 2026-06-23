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

  // ── Chiptune moods — warm, nostalgic, late-night. Pulse + triangle channels
  // through a warm lowpass and a generous reverb send (set per mood in `fx`).
  // Original sketches in the spirit of pastoral 8/16-bit scores; never a real tune.
  latenight: {
    id: 'latenight',
    label: 'Late-night Library',
    group: 'chiptune',
    tonic: { name: 'A', octave: 3 },
    mode: 'minor', // Aeolian: warm, quiet melancholy
    bpm: 64,
    beatsPerBar: 4,
    swing: 0,
    progression: [
      { degree: 1, size: 4 },
      { degree: 6, size: 3 },
      { degree: 3, size: 4 },
      { degree: 7, size: 3 },
    ],
    bassPattern: 'root',
    chordPattern: 'arp',
    pad: false,
    melodyDensity: 0.22, // very sparse, lots of air
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'pulse12', chord: 'pulse25', bass: 'tri' },
    masterFilter: { type: 'lowpass', freq: 2600, Q: 0.5 },
    fx: 0.32,
    percussion: false,
    crackle: false,
    flutter: false,
  },

  rainyfocus: {
    id: 'rainyfocus',
    label: 'Rainy Focus',
    group: 'chiptune',
    tonic: { name: 'D', octave: 4 },
    mode: 'dorian',
    bpm: 70,
    beatsPerBar: 4,
    swing: 0.2, // a gentle lean
    progression: [
      { degree: 2, size: 4 },
      { degree: 5, size: 4 },
      { degree: 1, size: 5 },
      { degree: 6, size: 4 },
    ],
    bassPattern: 'rootfifth',
    chordPattern: 'arp',
    pad: false,
    melodyDensity: 0.32,
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'pulse25', chord: 'pulse12', bass: 'tri' },
    masterFilter: { type: 'lowpass', freq: 2200, Q: 0.6 },
    fx: 0.28,
    percussion: false,
    crackle: false,
    flutter: false,
  },

  momentum: {
    id: 'momentum',
    label: 'Last-minute Momentum',
    group: 'chiptune',
    tonic: { name: 'G', octave: 3 },
    mode: 'mixolydian', // bright but grounded by the flat 7th
    bpm: 88,
    beatsPerBar: 4,
    swing: 0,
    progression: [
      { degree: 1, size: 3 },
      { degree: 5, size: 3 },
      { degree: 6, size: 4 },
      { degree: 4, size: 3 },
    ],
    bassPattern: 'rootfifth',
    chordPattern: 'arp',
    pad: false,
    melodyDensity: 0.5, // a touch more pulse, never anxious
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'pulse25', chord: 'pulse25', bass: 'tri' },
    masterFilter: { type: 'lowpass', freq: 3400, Q: 0.4 },
    fx: 0.16,
    percussion: true, // a soft backbeat tick
    crackle: false,
    flutter: false,
  },

  winddown: {
    id: 'winddown',
    label: 'Winding Down',
    group: 'chiptune',
    tonic: { name: 'C', octave: 4 },
    mode: 'lydian', // dreamy, the softest of the set
    bpm: 58,
    beatsPerBar: 4,
    swing: 0,
    progression: [
      { degree: 1, size: 5 },
      { degree: 6, size: 4 },
      { degree: 4, size: 5 },
      { degree: 1, size: 3 },
    ],
    bassPattern: 'root',
    chordPattern: 'arp',
    pad: true,
    melodyDensity: 0.18,
    octaves: { bass: 2, chord: 4, melody: 5 },
    voices: { lead: 'tri', chord: 'pulse12', bass: 'tri' },
    masterFilter: { type: 'lowpass', freq: 2400, Q: 0.5 },
    fx: 0.34,
    percussion: false,
    crackle: false,
    flutter: false,
  },
}

/**
 * The picker options, in display order. `group` (when present) names a section for
 * the UI's optgroups. 'off' and 'auto' are real selectable values.
 */
export const MUSIC_STYLES = [
  { id: OFF, label: 'Off' },
  { id: 'auto', label: 'Auto' },
  { id: 'ghibli', label: 'Ghibli', group: 'Instrumental' },
  { id: 'classical', label: 'Classical', group: 'Instrumental' },
  { id: 'lofi', label: 'Lofi', group: 'Instrumental' },
  { id: 'rainpiano', label: 'Rain Piano', group: 'Instrumental' },
  { id: 'latenight', label: 'Late-night Library', group: 'Chiptune' },
  { id: 'rainyfocus', label: 'Rainy Focus', group: 'Chiptune' },
  { id: 'momentum', label: 'Last-minute Momentum', group: 'Chiptune' },
  { id: 'winddown', label: 'Winding Down', group: 'Chiptune' },
]

const LABELS = Object.fromEntries(MUSIC_STYLES.map((s) => [s.id, s.label]))

/** A friendly label for a music id (Off/Auto/style/mood). */
export function labelFor(id) {
  return LABELS[id] || 'Off'
}

/** Look up a style preset by id, or null for 'off'/'auto'/unknown. */
export function getStyle(id) {
  return STYLES[id] || null
}
