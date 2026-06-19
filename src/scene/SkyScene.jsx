// A layered, hand-authored **pixel-art** sunset landscape that the whole
// dashboard scrolls over. Everything here is original SVG + CSS — no image files —
// so nothing can 404 on GitHub Pages. Shapes are drawn from crisp-edged <rect>s
// (no anti-aliasing) for a true blocky, lo-fi look. The palette warms through
// the day but always stays in sunset/dusk territory.
//
// All of this is decorative: the whole scene is aria-hidden + pointer-events-none.

import { memo } from 'react'

// --- Time-of-day palettes (all warmed to sunset; deep starry night) -----------
// Greeting (Header) still splits at <12 / <18; the scene adds dusk + night.
function timeOfDay(hour) {
  if (hour < 5) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 20) return 'evening'
  return 'night'
}

const SKIES = {
  // Pale rose/peach dawn.
  morning: {
    bands: ['#7C6BA0', '#A87FA8', '#D98BA6', '#F3AEBE', '#FBCDB0', '#FCE6C4'],
    sun: '#FFE9C2',
    sunHi: '#FFF6E2',
    sunGlow: 'rgba(255,224,170,0.6)',
    horizonGlow: 'rgba(252,200,160,0.55)',
    isMoon: false,
    hills: ['#9B7BA8', '#7C5E8C', '#5E4572', '#46335A'],
    cityFar: '#7C5E8A',
    cityNear: '#4A3760',
    cottage: '#3A2A50',
    cottageWindow: '#FFD27D',
    clouds: ['#FBD6CB', '#F7BEC4'],
    stars: false,
    fireflies: false,
    rain: false,
  },
  // Vivid pink / coral / gold sunset.
  afternoon: {
    bands: ['#3E3A6E', '#7E3F86', '#B14A82', '#E0719C', '#F4845F', '#F9A857'],
    sun: '#FFF1C9',
    sunHi: '#FFFDF2',
    sunGlow: 'rgba(255,210,125,0.55)',
    horizonGlow: 'rgba(244,132,95,0.6)',
    isMoon: false,
    hills: ['#8E5A86', '#6E4470', '#52335A', '#3C2647'],
    cityFar: '#6E4A78',
    cityNear: '#3A2A50',
    cottage: '#2C1E3E',
    cottageWindow: '#FFD27D',
    clouds: ['#FBC8B0', '#F4A6C0'],
    stars: false,
    fireflies: false,
    rain: false,
  },
  // Deep indigo → plum → magenta dusk, with moon + stars + fireflies + rain.
  evening: {
    bands: ['#241B3A', '#352A52', '#5C3A6E', '#9B3D73', '#C25A6E', '#E08A66'],
    sun: '#F2EAD3',
    sunHi: '#FFFFFF',
    sunGlow: 'rgba(232,234,214,0.45)',
    horizonGlow: 'rgba(224,138,102,0.5)',
    isMoon: true,
    hills: ['#4A3A66', '#3A2C52', '#2A2040', '#1E1730'],
    cityFar: '#42345E',
    cityNear: '#241B38',
    cottage: '#161024',
    cottageWindow: '#FFD27D',
    clouds: ['#7E5A78', '#9B5A6E'],
    stars: true,
    fireflies: true,
    rain: true,
    sparkles: true,
    shooting: true,
  },
  // Deep navy starry night — bright moon, twinkling sparkle-stars, shooting stars.
  night: {
    bands: ['#15163A', '#1C1E48', '#242759', '#2C2F6B', '#343B7A', '#41507F'],
    sun: '#EEF1FB',
    sunHi: '#FFFFFF',
    sunGlow: 'rgba(210,220,255,0.5)',
    horizonGlow: 'rgba(216,176,134,0.3)',
    isMoon: true,
    hills: ['#2A2E5E', '#212450', '#171A3C', '#0E1029'],
    cityFar: '#2A2E5E',
    cityNear: '#12142E',
    cottage: '#0C0E22',
    cottageWindow: '#FFD27D',
    clouds: ['#3A3E72', '#4A4E86'],
    stars: true,
    fireflies: true,
    rain: false,
    sparkles: true,
    shooting: true,
  },
}

// --- Hard-stop banded gradient (reads as a dithered pixel sky) ----------------
function bandedGradient(bands) {
  const n = bands.length
  const stops = bands.flatMap((c, i) => {
    const a = ((i / n) * 100).toFixed(2)
    const b = (((i + 1) / n) * 100).toFixed(2)
    return [`${c} ${a}%`, `${c} ${b}%`]
  })
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}

// --- Chunky pixel disc (sun / moon) -------------------------------------------
// One rect per row spanning the disc width — crisp, blocky edges.
const SUN_D = 14
const SUN_ROWS = Array.from({ length: SUN_D }).map((_, y) => {
  const c = (SUN_D - 1) / 2
  const r = SUN_D / 2
  const half = Math.floor(Math.sqrt(Math.max(0, r * r - (y - c) * (y - c))))
  return { y, x: Math.round(c - half), w: half * 2 + 1 }
})

// --- Pixel skyline: rows of buildings with lit windows ------------------------
function buildSkyline(n, minH, maxH, litChance) {
  const unit = 200 / n
  return Array.from({ length: n }).map((_, i) => {
    const h = Math.round(minH + Math.random() * (maxH - minH))
    const w = Math.round(unit * (0.72 + Math.random() * 0.22))
    const x = Math.round(i * unit + (unit - w) / 2)
    const top = 60 - h
    const cols = Math.max(1, Math.floor((w - 1) / 3))
    const rows = Math.max(1, Math.floor((h - 2) / 4))
    const windows = []
    for (let r = 0; r < rows; r++) {
      for (let cc = 0; cc < cols; cc++) {
        if (Math.random() < litChance) {
          windows.push({ x: x + 1.5 + cc * 3, y: top + 2 + r * 4 })
        }
      }
    }
    return { x, w, h, top, windows }
  })
}

const CITY_FAR = buildSkyline(26, 10, 26, 0.22)
const CITY_NEAR = buildSkyline(18, 16, 38, 0.32)

// --- Pixel hills: coarse height-maps rendered as vertical bars ----------------
function buildHill(steps, base, amp, rough) {
  let h = base
  return Array.from({ length: steps }).map(() => {
    h += (Math.random() - 0.5) * rough
    h = Math.max(base - amp, Math.min(base + amp, h))
    return Math.round(h)
  })
}
// viewBox is 0 0 200 100 (bottom-anchored). Nearer hills are taller.
const HILLS = [
  buildHill(40, 34, 8, 5),
  buildHill(34, 48, 10, 7),
  buildHill(28, 64, 12, 9),
  buildHill(22, 82, 12, 11),
]

// --- Blocky pixel cloud -------------------------------------------------------
const CLOUD_CELLS = ['  XXXX  ', ' XXXXXX ', 'XXXXXXXX', ' XXXXXX ']

// --- Ambient particle props (computed once at module load) --------------------
const STARS = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 42,
  size: Math.random() < 0.3 ? 3 : 2,
  duration: `${2.5 + Math.random() * 4}s`,
  delay: `${Math.random() * 5}s`,
}))

// Cross "✦" sparkle stars (twinkle in size + brightness).
const SPARKLES = Array.from({ length: 14 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 50,
  size: 9 + Math.round(Math.random() * 9),
  duration: `${2.6 + Math.random() * 3}s`,
  delay: `${Math.random() * 4}s`,
}))

// Occasional shooting stars (brief diagonal streaks, long dark waits).
const SHOOTING_STARS = Array.from({ length: 3 }).map((_, i) => ({
  id: i,
  top: 5 + Math.random() * 28,
  left: 6 + Math.random() * 52,
  width: 90 + Math.random() * 70,
  duration: `${7 + Math.random() * 6}s`,
  delay: `${i * 5 + Math.random() * 6}s`,
}))

const FIREFLIES = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  bottom: 6 + Math.random() * 38,
  left: 6 + Math.random() * 88,
  size: i % 3 === 0 ? 6 : 4,
  duration: `${13 + Math.random() * 9}s`,
  delay: `${Math.random() * 12}s`,
  drift: `${(Math.random() - 0.5) * 60}px`,
}))

const RAIN = Array.from({ length: 46 }).map((_, i) => ({
  id: i,
  left: (i / 46) * 112 - 6,
  jitter: (Math.random() - 0.5) * 8,
  duration: 0.6 + Math.random() * 0.85,
  delay: Math.random() * 5,
  height: 40 + Math.random() * 55,
  wide: i % 3 === 0,
}))

// A pixel "✦" sparkle star: thin cross arms + a bright square core.
function Sparkle({ size, style, className }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      className={`pixelated ${className}`}
      style={style}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g fill="#FFFFFF">
        <rect x="3" y="0" width="1" height="7" />
        <rect x="0" y="3" width="7" height="1" />
        <rect x="2" y="2" width="3" height="3" />
      </g>
    </svg>
  )
}

// A blocky cloud rendered from the CLOUD_CELLS grid.
function PixelCloud({ className = '', style, color }) {
  const cell = 8
  const rects = []
  CLOUD_CELLS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'X') rects.push({ x: x * cell, y: y * cell })
    }
  })
  const w = CLOUD_CELLS[0].length * cell
  const h = CLOUD_CELLS.length * cell
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`pixelated ${className}`}
      style={style}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={cell} height={cell} fill={color} />
      ))}
    </svg>
  )
}

// Decorative and prop-less: it reads the hour once at render, so memo() keeps it
// from re-rendering on every dashboard state change (e.g. the timer's tick).
function SkyScene() {
  const hour = new Date().getHours()
  const t = SKIES[timeOfDay(hour)]
  const stepW = 200

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Banded (dithered) pixel sky */}
      <div className="absolute inset-0" style={{ background: bandedGradient(t.bands) }} />
      <div className="pixel-dither absolute inset-0 opacity-40" />

      {/* Star field — square dot-stars + ✦ sparkle-stars, drifting almost
          imperceptibly across the sky (dusk + night). */}
      {(t.stars || t.sparkles) && (
        <div className="animate-star-drift absolute inset-0">
          {t.stars &&
            STARS.map((s) => (
              <span
                key={s.id}
                className="animate-twinkle absolute bg-white"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  height: `${s.size}px`,
                  width: `${s.size}px`,
                  animationDuration: s.duration,
                  animationDelay: s.delay,
                }}
              />
            ))}
          {t.sparkles &&
            SPARKLES.map((s) => (
              <Sparkle
                key={`sp${s.id}`}
                size={s.size}
                className="animate-sparkle absolute drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  animationDuration: s.duration,
                  animationDelay: s.delay,
                }}
              />
            ))}
        </div>
      )}

      {/* Shooting stars — brief diagonal streaks (dusk + night).
          Rotation on the wrapper; the streak animates along its own length. */}
      {t.shooting &&
        SHOOTING_STARS.map((s) => (
          <div
            key={`sh${s.id}`}
            className="absolute"
            style={{ top: `${s.top}%`, left: `${s.left}%`, transform: 'rotate(26deg)' }}
          >
            <span
              className="animate-shooting block h-px rounded-full"
              style={{
                width: `${s.width}px`,
                background: 'linear-gradient(to right, transparent, #ffffff)',
                boxShadow: '0 0 4px 1px rgba(255,255,255,0.7)',
                animationDuration: s.duration,
                animationDelay: s.delay,
              }}
            />
          </div>
        ))}

      {/* Chunky pixel sun / moon + glow halo */}
      <div className="absolute" style={{ top: '10%', right: '15%' }}>
        <div
          className="animate-lamp absolute -inset-20 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${t.sunGlow} 0%, transparent 70%)` }}
        />
        <svg
          viewBox={`0 0 ${SUN_D} ${SUN_D}`}
          className="animate-float pixelated relative"
          style={{ width: t.isMoon ? 104 : 120, height: t.isMoon ? 104 : 120 }}
          shapeRendering="crispEdges"
        >
          {SUN_ROWS.map((row) => (
            <rect key={row.y} x={row.x} y={row.y} width={row.w} height={1} fill={t.sun} />
          ))}
          {/* upper-left highlight */}
          <rect x={SUN_ROWS[4].x + 1} y={3} width={3} height={2} fill={t.sunHi} />
          {t.isMoon && (
            <>
              <rect x={5} y={4} width={2} height={2} fill="rgba(0,0,0,0.10)" />
              <rect x={8} y={7} width={2} height={2} fill="rgba(0,0,0,0.10)" />
              <rect x={6} y={9} width={1} height={1} fill="rgba(0,0,0,0.10)" />
            </>
          )}
        </svg>
      </div>

      {/* Drifting pixel clouds */}
      <div className="absolute inset-0">
        <PixelCloud
          color={t.clouds[0]}
          className="animate-cloud-slow absolute h-16 w-56 opacity-80"
          style={{ top: '14%', left: '-18%' }}
        />
        <PixelCloud
          color={t.clouds[1]}
          className="animate-cloud absolute h-12 w-44 opacity-70"
          style={{ top: '26%', left: '-28%', animationDelay: '-18s' }}
        />
        <PixelCloud
          color={t.clouds[0]}
          className="animate-cloud-slow absolute h-14 w-48 opacity-60"
          style={{ top: '7%', left: '-42%', animationDelay: '-40s' }}
        />
      </div>

      {/* Warm horizon glow where the sun meets the skyline (the sunset band) */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '34%',
          height: '26%',
          background: `radial-gradient(130% 100% at 72% 100%, ${t.horizonGlow} 0%, transparent 68%)`,
        }}
      />

      {/* Distant pixel city skyline (behind the hills) */}
      <svg
        className="pixelated absolute left-0 w-full"
        style={{ bottom: '38%', height: '24%' }}
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {/* far layer */}
        {CITY_FAR.map((b, i) => (
          <g key={`f${i}`}>
            <rect x={b.x} y={b.top} width={b.w} height={b.h} fill={t.cityFar} opacity="0.75" />
            {b.windows.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={1.2} height={1.6} fill={t.cottageWindow} opacity="0.5" />
            ))}
          </g>
        ))}
        {/* near layer */}
        {CITY_NEAR.map((b, i) => (
          <g key={`n${i}`}>
            <rect x={b.x} y={b.top} width={b.w} height={b.h} fill={t.cityNear} />
            {b.windows.map((w, j) => (
              <rect
                key={j}
                className={j % 7 === 0 ? 'animate-twinkle' : ''}
                x={w.x}
                y={w.y}
                width={1.4}
                height={1.8}
                fill={t.cottageWindow}
                opacity="0.85"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Rolling pixel hills — coarse height-maps as vertical bars */}
      <svg
        className="pixelated absolute bottom-0 left-0 w-full"
        style={{ height: '44%' }}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {HILLS.map((hill, layer) => {
          const w = stepW / hill.length
          return (
            <g key={layer} fill={t.hills[layer]}>
              {hill.map((h, i) => (
                <rect key={i} x={i * w} y={100 - h} width={w + 0.5} height={h} />
              ))}
            </g>
          )
        })}
      </svg>

      {/* Pixel cottage with a warm glowing window, on the mid hill */}
      <div className="absolute" style={{ bottom: '31%', left: '16%' }}>
        <div
          className="animate-lamp absolute -inset-6 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${t.cottageWindow}66 0%, transparent 70%)` }}
        />
        <svg
          width="96"
          height="84"
          viewBox="0 0 48 42"
          className="pixelated relative drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* trees (blocky) */}
          <g fill={t.hills[3]}>
            <rect x="2" y="20" width="8" height="12" />
            <rect x="4" y="16" width="4" height="4" />
            <rect x="40" y="18" width="8" height="14" />
            <rect x="42" y="14" width="4" height="4" />
          </g>
          {/* roof — stepped pixel triangle */}
          <g fill={t.cottage}>
            <rect x="22" y="6" width="4" height="3" />
            <rect x="19" y="9" width="10" height="3" />
            <rect x="16" y="12" width="16" height="3" />
            <rect x="13" y="15" width="22" height="3" />
          </g>
          {/* body */}
          <rect x="16" y="18" width="16" height="16" fill={t.cottage} />
          {/* chimney */}
          <rect x="28" y="4" width="3" height="6" fill={t.cottage} />
          {/* glowing window */}
          <rect x="20" y="22" width="8" height="8" fill={t.cottageWindow} />
          <rect x="23.5" y="22" width="1" height="8" fill={t.cottage} />
          <rect x="20" y="25.5" width="8" height="1" fill={t.cottage} />
        </svg>
      </div>

      {/* Pixel bushes at the bottom corners */}
      <svg
        className="pixelated absolute bottom-0 left-0 w-full"
        style={{ height: '60px' }}
        viewBox="0 0 200 30"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <g fill={t.hills[3]}>
          <rect x="0" y="14" width="34" height="16" />
          <rect x="6" y="10" width="10" height="4" />
          <rect x="20" y="8" width="10" height="6" />
          <rect x="170" y="12" width="30" height="18" />
          <rect x="176" y="8" width="10" height="4" />
          <rect x="186" y="10" width="10" height="4" />
        </g>
      </svg>

      {/* Rain — square pixels (dusk only) */}
      {t.rain && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[15%]" style={{ transform: 'rotate(8deg)' }}>
            {RAIN.map((s) => (
              <span
                key={s.id}
                className={`absolute top-0 bg-gradient-to-b from-transparent to-transparent ${
                  s.wide ? 'w-0.5 via-white/30 animate-rain-wide' : 'w-px via-white/45 animate-rain'
                }`}
                style={{
                  left: `${s.left + s.jitter}%`,
                  height: `${s.height}px`,
                  animationDuration: `${s.duration}s`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fireflies — square gold pixels (dusk only) */}
      {t.fireflies &&
        FIREFLIES.map((b) => (
          <span
            key={b.id}
            className="animate-bokeh absolute bg-sunset-gold"
            style={{
              bottom: `${b.bottom}%`,
              left: `${b.left}%`,
              height: `${b.size}px`,
              width: `${b.size}px`,
              boxShadow: '0 0 6px 1px rgba(255,210,125,0.7)',
              animationDuration: b.duration,
              animationDelay: b.delay,
              '--drift': b.drift,
            }}
          />
        ))}

      {/* Cozy room edge vignette */}
      <div className="room-vignette absolute inset-0" />
    </div>
  )
}

export default memo(SkyScene)
