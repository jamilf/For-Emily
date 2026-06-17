// A layered, hand-authored painterly "Studio Ghibli" landscape that the whole
// dashboard scrolls over. Everything here is original SVG + CSS — no image files —
// so nothing can 404 on GitHub Pages. The palette shifts gently with time of day.
//
// All of this is decorative: the whole scene is aria-hidden + pointer-events-none.

// --- Time-of-day palettes -----------------------------------------------------
// Boundaries mirror Header.getGreeting: <12 morning, <18 afternoon, else evening.
function timeOfDay(hour) {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const SKIES = {
  morning: {
    sky: ['#E9C9A0', '#E7B98C', '#CBB689', '#A9B98A'], // peach → soft gold → green haze
    orb: '#FBE3B3',
    orbGlow: 'rgba(251,227,179,0.65)',
    isMoon: false,
    haze: 'rgba(245, 224, 188, 0.5)',
    hills: ['#9BB089', '#7E9A6E', '#5E7C54', '#41603C'],
    cottage: '#33473A',
    cottageWindow: '#F2C66B',
    fireflies: false,
    rain: false,
  },
  afternoon: {
    sky: ['#9FC6CB', '#A9CBC0', '#B6C99E', '#A9B98A'], // soft blue-green day
    orb: '#FFF4D6',
    orbGlow: 'rgba(255,244,214,0.55)',
    isMoon: false,
    haze: 'rgba(220, 233, 222, 0.5)',
    hills: ['#A7C08C', '#86A86F', '#5E7C54', '#41603C'],
    cottage: '#33473A',
    cottageWindow: '#F2C66B',
    fireflies: false,
    rain: false,
  },
  evening: {
    sky: ['#2B3A55', '#3C4A6B', '#5A5170', '#6E5A63'], // deep indigo → warm dusk horizon
    orb: '#E8EAD6',
    orbGlow: 'rgba(232,234,214,0.45)',
    isMoon: true,
    haze: 'rgba(60, 74, 107, 0.55)',
    hills: ['#3E5A52', '#33493F', '#28392F', '#1E2B25'],
    cottage: '#161F1C',
    cottageWindow: '#F4C56A',
    fireflies: true,
    rain: true,
  },
}

// --- Deterministic-ish scene props (computed once at module load) -------------
const STARS = Array.from({ length: 36 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 45,
  size: Math.random() < 0.25 ? 2.5 : 1.5,
  duration: `${2.5 + Math.random() * 4}s`,
  delay: `${Math.random() * 5}s`,
}))

const FIREFLIES = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  bottom: 6 + Math.random() * 38,
  left: 6 + Math.random() * 88,
  size: i % 3 === 0 ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5',
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

// A soft, blobby Ghibli cloud built from overlapping circles in one path-ish group.
function Cloud({ className = '', style }) {
  return (
    <svg viewBox="0 0 220 90" className={className} style={style} aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="60" cy="58" rx="56" ry="30" />
        <ellipse cx="110" cy="44" rx="50" ry="34" />
        <ellipse cx="158" cy="56" rx="48" ry="28" />
        <ellipse cx="100" cy="64" rx="70" ry="24" />
      </g>
    </svg>
  )
}

export default function SkyScene() {
  const hour = new Date().getHours()
  const t = SKIES[timeOfDay(hour)]

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${t.sky[0]} 0%, ${t.sky[1]} 38%, ${t.sky[2]} 68%, ${t.sky[3]} 100%)`,
        }}
      />

      {/* Stars (dusk only) */}
      {t.isMoon &&
        STARS.map((s) => (
          <span
            key={s.id}
            className="animate-twinkle absolute rounded-full bg-white"
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

      {/* Celestial body + glow halo */}
      <div className="absolute" style={{ top: '9%', right: '14%' }}>
        <div
          className="animate-lamp absolute -inset-24 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${t.orbGlow} 0%, transparent 70%)` }}
        />
        <div
          className="animate-float relative rounded-full"
          style={{
            height: t.isMoon ? '92px' : '108px',
            width: t.isMoon ? '92px' : '108px',
            background: `radial-gradient(circle at 38% 35%, #ffffff 0%, ${t.orb} 55%, ${t.orb} 100%)`,
            boxShadow: `0 0 60px 12px ${t.orbGlow}`,
          }}
        >
          {/* Moon craters */}
          {t.isMoon && (
            <>
              <span className="absolute rounded-full bg-black/10" style={{ width: 16, height: 16, top: 22, left: 24 }} />
              <span className="absolute rounded-full bg-black/10" style={{ width: 10, height: 10, top: 48, left: 52 }} />
              <span className="absolute rounded-full bg-black/10" style={{ width: 8, height: 8, top: 30, left: 60 }} />
            </>
          )}
        </div>
      </div>

      {/* Clouds — two parallax layers drifting at different speeds */}
      <div className="absolute inset-0 text-white/70">
        <Cloud
          className="animate-cloud-slow absolute h-24 w-60 opacity-80 blur-[1px]"
          style={{ top: '12%', left: '-15%' }}
        />
        <Cloud
          className="animate-cloud absolute h-16 w-44 opacity-60 blur-[2px]"
          style={{ top: '24%', left: '-25%', animationDelay: '-18s' }}
        />
        <Cloud
          className="animate-cloud-slow absolute h-20 w-52 opacity-50 blur-[1px]"
          style={{ top: '6%', left: '-40%', animationDelay: '-40s' }}
        />
      </div>

      {/* Soft fog band over the far hills */}
      <div
        className="animate-fog absolute left-0 right-0"
        style={{
          bottom: '30%',
          height: '120px',
          background: `linear-gradient(to bottom, transparent, ${t.haze}, transparent)`,
          filter: 'blur(8px)',
        }}
      />

      {/* Rolling hills — receding bands for depth */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '52%' }}
        viewBox="0 0 1440 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* farthest */}
        <path d="M0 240 Q 360 150 720 220 T 1440 200 V 480 H 0 Z" fill={t.hills[0]} opacity="0.85" />
        {/* mid-far */}
        <path d="M0 300 Q 300 220 640 290 T 1440 280 V 480 H 0 Z" fill={t.hills[1]} opacity="0.92" />
        {/* mid-near (cottage sits on this one) */}
        <path d="M0 360 Q 420 300 820 350 T 1440 340 V 480 H 0 Z" fill={t.hills[2]} />
        {/* nearest */}
        <path d="M0 420 Q 360 380 760 410 T 1440 400 V 480 H 0 Z" fill={t.hills[3]} />
      </svg>

      {/* Cottage with a warm glowing window + a couple of trees, on the mid hill */}
      <div className="absolute" style={{ bottom: '30%', left: '17%' }}>
        {/* warm spill of light */}
        <div
          className="animate-lamp absolute -inset-8 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${t.cottageWindow}55 0%, transparent 70%)` }}
        />
        <svg width="120" height="92" viewBox="0 0 120 92" aria-hidden="true" className="relative drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">
          {/* trees */}
          <g fill={t.hills[3]}>
            <ellipse cx="14" cy="64" rx="13" ry="20" />
            <rect x="11" y="74" width="6" height="14" />
            <ellipse cx="106" cy="60" rx="15" ry="24" />
            <rect x="103" y="74" width="6" height="14" />
          </g>
          {/* cottage body */}
          <rect x="40" y="50" width="44" height="38" rx="2" fill={t.cottage} />
          {/* roof */}
          <path d="M34 52 L62 28 L90 52 Z" fill={t.cottage} />
          {/* glowing window */}
          <rect x="54" y="60" width="16" height="16" rx="1.5" fill={t.cottageWindow} />
          <line x1="62" y1="60" x2="62" y2="76" stroke={t.cottage} strokeWidth="1.5" />
          <line x1="54" y1="68" x2="70" y2="68" stroke={t.cottage} strokeWidth="1.5" />
          {/* chimney */}
          <rect x="76" y="34" width="7" height="16" fill={t.cottage} />
        </svg>
      </div>

      {/* Foreground foliage fringe (bottom corners) */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '120px' }}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 120 V60 Q 40 30 70 60 Q 90 20 120 55 Q 150 25 180 60 Q 210 40 240 70 L 240 120 Z"
          fill={t.hills[3]}
        />
        <path
          d="M1440 120 V55 Q 1400 25 1370 58 Q 1345 20 1315 55 Q 1285 30 1255 62 Q 1225 40 1200 70 L 1200 120 Z"
          fill={t.hills[3]}
        />
      </svg>

      {/* Rain (dusk only) */}
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

      {/* Fireflies / bokeh (dusk only) */}
      {t.fireflies &&
        FIREFLIES.map((b) => (
          <span
            key={b.id}
            className={`animate-bokeh absolute rounded-full bg-ever-yellow/70 blur-sm ${b.size}`}
            style={{
              bottom: `${b.bottom}%`,
              left: `${b.left}%`,
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
