// scoreArc — the pure mapping from a session's scene phase to the chiptune engine's
// per-role gain multipliers, and the short original resolution motif played once on
// a real harvest. No Web Audio and no randomness: this file decides only WHAT
// changes, never HOW (the player, MusicPlayer.js, turns it into sound).

// Every layer at full presence: the default outside any session phase, so a
// session simply never having started (or already finished) leaves the score
// exactly as it always sounded.
const FULL = { bass: 1, pad: 1, chord: 1, lead: 1, perc: 1 }

// The bed (bass) is always present; the pad and chord layers bloom in as the
// session escalates, mirroring the visual scene above it. Golden and done are
// full presence, so the score's own "golden minute" is simply everything, warmly.
const PHASE_LAYERS = {
  settling: { bass: 1, pad: 0, chord: 0.55, lead: 0.7, perc: 1 },
  growing: { bass: 1, pad: 0.65, chord: 0.85, lead: 0.9, perc: 1 },
  golden: FULL,
  done: FULL,
}

/**
 * Role-gain multipliers for a scene phase (see sessionBloom.js). Unknown or
 * missing phases (including no session at all) resolve to full presence.
 * @param {'settling'|'growing'|'golden'|'done'|null} [phase]
 * @returns {{bass:number,pad:number,chord:number,lead:number,perc:number}}
 */
export function layersForPhase(phase) {
  return PHASE_LAYERS[phase] || FULL
}

// A short, original resolution motif for a real harvest: a gentle rising phrase
// resolving on the octave, with a soft triad underneath. Scale degrees (1-based)
// relative to whatever style is currently playing, so it always lands in key; no
// copyrighted melody or interpolation of one. ~2.9 beats, a few bars at any tempo.
export const RESOLUTION_MOTIF = [
  { start: 0, dur: 0.45, degree: 1, voice: 'tri', gain: 0.42 },
  { start: 0.5, dur: 0.45, degree: 3, voice: 'tri', gain: 0.44 },
  { start: 1.0, dur: 0.5, degree: 5, voice: 'tri', gain: 0.48 },
  { start: 1.6, dur: 1.3, degree: 8, voice: 'tri', gain: 0.5 },
  { start: 1.6, dur: 1.3, degree: 5, voice: 'pad', gain: 0.28 },
  { start: 1.6, dur: 1.3, degree: 3, voice: 'pad', gain: 0.22 },
]
