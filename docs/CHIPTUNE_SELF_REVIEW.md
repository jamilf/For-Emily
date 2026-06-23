# Chiptune music engine — self-review

Audio can't be rendered in a headless test, so likeness and feel are reasoned about
here and proven structurally by the deterministic generator tests. The goal is the
warm, nostalgic, late-night idiom of pastoral 8/16-bit scores (the unhurried town
theme, the gentle prelude, the lullaby) — **never** any actual copyrighted melody.
Every mood is an original sketch built from mode + tempo + a diatonic loop; the
generator improvises within it from a seed, so no fixed tune is ever stored or
reproduced.

## How originality is guaranteed

- `generator.planBar` is pure and seeded: notes are chosen by a mulberry32 RNG over
  the mode's scale and the bar's chord tones. There is no transcribed phrase anywhere
  in the codebase — only scales, chord stacks, and probabilities.
- Progressions are generic diatonic functions (i–VI–III–VII, ii–V–I–vi, etc.), the
  common property of the genre, not of any one song.
- Voices are synthesized from first principles (pulse via Fourier duty coefficients,
  triangle, filtered noise) — no samples, no audio files.

## Per-mood intent vs. the idiom

| Mood | Mode / tonic | BPM | Voices | Feel & low-arousal rationale |
|------|--------------|-----|--------|------------------------------|
| **Late-night Library** | A Aeolian | 64 | pulse12 lead, pulse25 arp, tri bass | Quiet minor melancholy, very sparse (density 0.22), big reverb send (0.32). Lots of air between notes — calm, never demanding attention. |
| **Rainy Focus** | D Dorian | 70 | pulse25 lead, pulse12 arp, tri bass | Cozy minor-with-a-hopeful-6th, a gentle swing (0.2), warmer lowpass (2200 Hz). Pairs with the rain layer; Auto picks it when rain is up. |
| **Last-minute Momentum** | G Mixolydian | 88 | pulse25 lead+arp, tri bass | Bright but grounded by the flat-7th, a touch more pulse (density 0.5) and a soft backbeat tick — forward motion without anxiety. Lowest reverb (0.16) keeps it present. |
| **Winding Down** | C Lydian | 58 | tri lead, pulse12 arp, tri bass | The softest, slowest, dreamiest (raised 4th), a pad underneath, biggest reverb (0.34), density 0.18. For the end of a session. |

Tempos sit in a low-arousal 58–88 BPM band; the brighter the mood, the faster, but
all stay well under driving "battle" tempos. Leads use the thinner 12.5% / 25% duty
pulses (warmer, reedier) rather than the full square; everything passes through a
per-mood lowpass and a procedural reverb for late-night intimacy.

## Context behaviour

- **Auto** (`pickAutoMood`, pure + tested): meaningful rain → Rainy Focus; small hours
  → Winding Down; late evening or an active focus session → Late-night Library;
  otherwise a gentle Momentum. Re-resolves (crossfaded) as the hour or rain changes.
- **Focus duck + simplify**: during a Pomodoro session the music dips to half volume
  and drops the melody + percussion, leaving the calm bass/chord/pad bed — then
  restores on the break.

## Entrainment toggle — honest framing

Opt-in and off by default. It applies a faint ~10 Hz amplitude wobble to the music
bus. The UI says plainly: *"Experimental: a faint, even pulse in the music that some
people find focusing. It may do nothing."* No brain-wave claims. Fully removable
(the LFO is torn down when the toggle is off).

## Recommendation

The structural tests confirm in-mode, in-chord, deterministic, low-density material
across all four moods. Likeness of *feel* is best judged by ear — Emily should
listen on the deployed build and we can tune tempo, density, reverb, or voice duty
per mood from there.
