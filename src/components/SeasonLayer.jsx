import { useMemo } from 'react'

// A few deterministic particle slots so the drift never reshuffles between renders.
const SLOTS = [
  { left: '8%', dur: 13, delay: 0, sway: 14, size: 6 },
  { left: '20%', dur: 17, delay: 2.5, sway: -10, size: 5 },
  { left: '33%', dur: 15, delay: 5, sway: 12, size: 7 },
  { left: '47%', dur: 19, delay: 1, sway: -16, size: 5 },
  { left: '61%', dur: 14, delay: 6.5, sway: 10, size: 6 },
  { left: '74%', dur: 18, delay: 3.5, sway: -12, size: 7 },
  { left: '86%', dur: 16, delay: 8, sway: 14, size: 5 },
  { left: '93%', dur: 20, delay: 4.5, sway: -8, size: 6 },
]

/** Petals/snow read as soft circles; leaves/motes as tiny rounded squares. */
function shapeRadius(particle) {
  return particle === 'leaf' || particle === 'mote' ? '30%' : '50%'
}

/**
 * Decorative seasonal overlay — a bottom-weighted tint plus a handful of drifting
 * particles. Purely cosmetic (aria-hidden, pointer-events-none) and sits BEHIND the
 * opaque content, so it never affects text contrast. The tint is transparent at the
 * top to protect the header text. Honors prefers-reduced-motion by dropping the
 * particles entirely (the static tint + the season label still convey the season).
 */
export default function SeasonLayer({ season }) {
  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  if (!season) return null

  return (
    <div aria-hidden="true" className="season-layer pointer-events-none fixed inset-0 z-[1]">
      {/* Bottom-weighted tint: tinted near the grass, transparent up top. */}
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: `linear-gradient(to top, ${season.tint} 0%, transparent 55%)` }}
      />

      {/* Ambient drift — only when motion is allowed. */}
      {!reduced &&
        SLOTS.map((s, i) => (
          <span
            key={i}
            className="season-particle block"
            style={{
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: shapeRadius(season.particle),
              background: season.accent,
              boxShadow: `0 0 4px ${season.accent}`,
              '--season-dur': `${s.dur}s`,
              '--season-delay': `${s.delay}s`,
              '--season-sway': `${s.sway}px`,
              '--season-opacity': 0.5,
            }}
          />
        ))}
    </div>
  )
}
