// Pure helpers for the chiptune voices. No Web Audio here — just the math, so it
// stays deterministic and unit-testable. The player turns these into PeriodicWaves.

/**
 * Fourier coefficients for a band-limited duty-cycle pulse, shaped for
 * `AudioContext.createPeriodicWave(real, imag)`. A centred (no-DC) pulse of duty d
 * has the cosine series `real[n] = (2/(nπ))·sin(nπ·d)` with `imag = 0`. This is the
 * classic NES pulse spectrum: at d = 0.5 only the odd harmonics survive (a square
 * wave); lower duties (12.5%, 25%) read thinner and warmer.
 * @param {number} duty fraction in (0, 1)
 * @param {number} partials number of harmonics to include
 * @returns {{ real: Float32Array, imag: Float32Array }}
 */
export function pulseCoeffs(duty, partials = 24) {
  const n = Math.max(1, partials | 0)
  const real = new Float32Array(n + 1)
  const imag = new Float32Array(n + 1)
  const d = Math.min(0.99, Math.max(0.01, duty))
  // index 0 is DC, left at 0 so the wave carries no offset.
  for (let k = 1; k <= n; k++) {
    real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d)
  }
  return { real, imag }
}

/** Duty fraction for a chiptune voice name like 'pulse12' | 'pulse25' | 'pulse50'. */
export function dutyOf(voice) {
  if (voice === 'pulse12') return 0.125
  if (voice === 'pulse25') return 0.25
  if (voice === 'pulse50') return 0.5
  return null
}
