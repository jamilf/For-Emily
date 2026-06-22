import { useMemo, useRef } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useFocusTrap from '../hooks/useFocusTrap.js'
import { constellationMetrics, buildSky } from '../data/constellations.js'

const COLS = 3
const CELL_W = 100
const CELL_H = 84
const PAD_X = 12
const PAD_Y = 12

// Tokens only — cream/gold lit, muted grey when still dark.
const LIT = '#FDF6E3'
const FORMED = '#FFD27D'
const DIM = '#859289'

/** Tiny deterministic PRNG so the ambient backdrop stars never reshuffle. */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Constellations — a cozy night-sky view of progress, derived entirely from existing
 * data (no new persistence/sync). Each named constellation lights its stars as study
 * accumulates. The sky is decorative (aria-hidden); the list below it carries every
 * bit of state in text, so nothing depends on colour. A lazy, focus-trapped modal.
 */
export default function Constellations({ onClose }) {
  const [garden] = usePersistedState('emily.garden', [])
  const [focusLog] = usePersistedState('emily.focusLog', {})
  const [flashcardStats] = usePersistedState('emily.flashcardStats', {})
  const [reflections] = usePersistedState('emily.reflections', [])
  const [memories] = usePersistedState('emily.memories', [])
  const [spirits] = usePersistedState('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })

  const closeRef = useRef(null)
  const trapRef = useFocusTrap(true, { onEscape: onClose, initialFocus: closeRef })

  const reduced = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  const sky = useMemo(() => {
    const metrics = constellationMetrics({ garden, focusLog, flashcardStats, reflections, memories, spirits })
    return buildSky(metrics)
  }, [garden, focusLog, flashcardStats, reflections, memories, spirits])

  const rows = Math.ceil(sky.length / COLS)
  const width = COLS * CELL_W
  const height = rows * CELL_H
  const formedCount = sky.filter((c) => c.formed).length

  // Ambient backdrop stars (decorative, static).
  const ambient = useMemo(() => {
    const rng = mulberry32(20260621)
    return Array.from({ length: 28 }, () => ({
      cx: rng() * width,
      cy: rng() * height,
      r: 0.3 + rng() * 0.5,
    }))
  }, [width, height])

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center modal-overlay-pad">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-bgDim/75 sm:backdrop-blur-sm"
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your Constellations"
        tabIndex={-1}
        className="animate-modal-in relative z-10 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
      >
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            🌌 Your Constellations
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close constellations"
            className="grid h-10 w-10 place-items-center rounded-full text-cream/90 transition-colors hover:text-cream active:scale-90 focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto bg-bg0 p-5 text-fg">
          <p className="text-sm text-fg/80">
            Every constellation lights up as you study: sessions, days, cards, the spirits that find you. They
            only ever grow brighter.
          </p>

          {/* Decorative sky — the list below carries the real state. */}
          <div
            className="overflow-hidden rounded-2xl border-2 border-bg3/40"
            style={{ background: 'linear-gradient(to bottom, #2D2350, #232A2E 90%)' }}
          >
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {ambient.map((s, i) => (
                <circle key={`amb-${i}`} cx={s.cx} cy={s.cy} r={s.r} fill={DIM} opacity={0.35} />
              ))}

              {sky.map((c, i) => {
                const col = i % COLS
                const row = Math.floor(i / COLS)
                const ox = col * CELL_W + PAD_X
                const oy = row * CELL_H + PAD_Y
                const iw = CELL_W - 2 * PAD_X
                const ih = CELL_H - 2 * PAD_Y
                const pts = c.stars.map((s) => ({ x: ox + s.x * iw, y: oy + s.y * ih }))
                const lineColor = c.formed ? FORMED : DIM
                const lineOpacity = c.formed ? 0.55 : 0.18
                return (
                  <g key={c.id}>
                    <polyline
                      points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={0.6}
                      strokeOpacity={lineOpacity}
                    />
                    {pts.map((p, si) => {
                      const lit = si < c.litStars
                      return (
                        <circle
                          key={si}
                          cx={p.x}
                          cy={p.y}
                          r={lit ? 1.9 : 0.9}
                          fill={lit ? (c.formed ? FORMED : LIT) : DIM}
                          opacity={lit ? 1 : 0.4}
                          className={lit && !reduced ? 'animate-twinkle' : undefined}
                          style={lit && !reduced ? { animationDelay: `${(si % 5) * 0.5}s` } : undefined}
                        />
                      )
                    })}
                    {c.formed && (
                      <text
                        x={col * CELL_W + CELL_W / 2}
                        y={row * CELL_H + CELL_H - 5}
                        textAnchor="middle"
                        fontSize="6"
                        fill={FORMED}
                        opacity={0.9}
                      >
                        {c.name}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          <p className="font-display text-sm text-ever-yellow" aria-live="polite">
            {formedCount} of {sky.length} constellations formed
          </p>

          {/* The accessible equivalent — all state in text + shape, never colour alone. */}
          <ul className="space-y-2">
            {sky.map((c) => (
              <li key={c.id} className="rounded-2xl bg-bg2/50 p-3">
                <p className="font-display text-sm text-fg">
                  {c.name}
                  {': '}
                  {c.formed ? (
                    <span className="text-ever-green">✦ Formed</span>
                  ) : (
                    <span className="text-fg/70">
                      {c.litStars} of {c.stars.length} stars lit
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-fg/70">{c.blurb}</p>
                {!c.formed && (
                  <p className="mt-1 text-xs text-fg/55">
                    {c.progress.current} / {c.progress.target}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
