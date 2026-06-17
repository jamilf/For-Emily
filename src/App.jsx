import Header from './components/Header.jsx'
import BookNook from './components/BookNook.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import MindsGarden from './components/MindsGarden.jsx'

// Scene data is computed once at module load (no re-randomising on re-render).

const RAIN_STREAKS = Array.from({ length: 55 }).map((_, i) => ({
  id: i,
  left: (i / 55) * 110 - 5,
  jitter: (Math.random() - 0.5) * 8,
  duration: 0.55 + Math.random() * 0.8,
  delay: Math.random() * 5,
  height: 45 + Math.random() * 55,
  wide: i % 3 === 0,
}))

const DRIP_STREAKS = Array.from({ length: 4 }).map((_, i) => ({
  id: i,
  left: 15 + i * 22 + Math.random() * 8,
  duration: 9 + Math.random() * 6,
  delay: Math.random() * 8,
}))

const FOLIAGE_BLOBS = [
  { id: 0, cls: 'absolute -left-24 top-8 h-80 w-80 rounded-full bg-ever-green/15', dur: '10s', delay: '0s' },
  { id: 1, cls: 'absolute right-0 top-1/3 h-96 w-96 rounded-full bg-bg2/60', dur: '14s', delay: '-4s' },
  { id: 2, cls: 'absolute bottom-0 left-1/4 h-72 w-[28rem] rounded-full bg-bgDim/70', dur: '8s', delay: '-2s' },
  { id: 3, cls: 'absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-ever-green/10', dur: '11s', delay: '-6s' },
  { id: 4, cls: 'absolute left-1/2 -top-20 h-60 w-60 -translate-x-1/2 rounded-full bg-bg1/50', dur: '16s', delay: '-8s' },
]

const BOKEH = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  bottom: 5 + Math.random() * 40,
  left: 5 + Math.random() * 90,
  size: i % 3 === 0 ? 'h-3 w-3' : 'h-2 w-2',
  colour: i % 2 === 0 ? 'bg-ever-yellow/60' : 'bg-ever-aqua/50',
  duration: `${12 + Math.random() * 8}s`,
  delay: `${Math.random() * 12}s`,
  drift: `${(Math.random() - 0.5) * 60}px`,
}))

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-bgDim to-bg0">
      {/* Pastel-green graph-paper "desktop" wallpaper */}
      <div aria-hidden="true" className="grid-wallpaper pointer-events-none absolute inset-0" />

      {/* Drifting foliage */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 blur-3xl">
        {FOLIAGE_BLOBS.map((b) => (
          <div key={b.id} className={`${b.cls} animate-blob-drift`} style={{ animationDuration: b.dur, animationDelay: b.delay }} />
        ))}
      </div>

      {/* Warm lamplight upper-right */}
      <div
        aria-hidden="true"
        className="animate-lamp pointer-events-none absolute -right-8 -top-8 h-[40rem] w-[40rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(219,188,127,0.55) 0%, rgba(219,188,127,0.22) 38%, rgba(219,188,127,0) 68%)',
        }}
      />

      {/* Cool moonlight lower-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-[22rem] w-[22rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(131,192,146,0.18) 0%, rgba(131,192,146,0.06) 50%, transparent 70%)',
        }}
      />

      {/* Angled rain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[15%]" style={{ transform: 'rotate(8deg)' }}>
          {RAIN_STREAKS.map((s) => (
            <span
              key={s.id}
              className={`absolute top-0 bg-gradient-to-b from-transparent ${
                s.wide ? 'via-white/45 w-0.5 animate-rain-wide' : 'via-white/60 w-px animate-rain'
              } to-transparent`}
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

      {/* Condensation drips */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {DRIP_STREAKS.map((d) => (
          <span
            key={d.id}
            className="animate-drip absolute top-0 w-px bg-gradient-to-b from-transparent via-white/35 to-transparent"
            style={{ left: `${d.left}%`, height: '160px', animationDuration: `${d.duration}s`, animationDelay: `${d.delay}s` }}
          />
        ))}
      </div>

      {/* Bokeh fireflies */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BOKEH.map((b) => (
          <span
            key={b.id}
            className={`animate-bokeh absolute rounded-full blur-sm ${b.size} ${b.colour}`}
            style={{ bottom: `${b.bottom}%`, left: `${b.left}%`, animationDuration: b.duration, animationDelay: b.delay, '--drift': b.drift }}
          />
        ))}
      </div>

      {/* Cozy room edge vignette */}
      <div aria-hidden="true" className="room-vignette pointer-events-none absolute inset-0" />

      {/* Foreground */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Header />

        <div className="grid grid-cols-1 items-start gap-5 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 sm:gap-6">
          <div className="animate-slide-up order-2 min-[640px]:order-2 min-[900px]:order-1" style={{ animationDelay: '150ms' }}>
            <BookNook />
          </div>
          <div
            className="animate-slide-up order-1 min-[640px]:order-1 min-[640px]:col-span-2 min-[900px]:order-2 min-[900px]:col-span-1"
            style={{ animationDelay: '0ms' }}
          >
            <PomodoroTimer />
          </div>
          <div className="animate-slide-up order-3 min-[640px]:order-3 min-[900px]:order-3" style={{ animationDelay: '300ms' }}>
            <MindsGarden />
          </div>
        </div>

        <footer className="mt-12 text-center font-display text-sm text-fg/60">
          Made with care for Emily. Be gentle with yourself today. 🤍
        </footer>
      </main>
    </div>
  )
}
