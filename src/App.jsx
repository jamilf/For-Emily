import Header from './components/Header.jsx'
import BookNook from './components/BookNook.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import MindsGarden from './components/MindsGarden.jsx'

// A handful of rain streaks with varied position/speed for a natural look.
const RAIN_STREAKS = Array.from({ length: 28 }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  duration: 0.6 + Math.random() * 0.9,
  delay: Math.random() * 4,
  height: 40 + Math.random() * 50,
}))

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-forest to-olive">
      {/* ---------------------------------------------------------------- *
       * Background scene, layered back-to-front. All pure CSS so it stays
       * light and pauses under prefers-reduced-motion.
       * ---------------------------------------------------------------- */}

      {/* Blurred distant foliage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-olive/40 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-ever-green/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-96 rounded-full bg-forest/60 blur-3xl" />
      </div>

      {/* Warm Arrietty lamplight in one corner */}
      <div
        aria-hidden="true"
        className="animate-lamp pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(219,188,127,0.45) 0%, rgba(219,188,127,0.18) 35%, rgba(219,188,127,0) 70%)',
        }}
      />

      {/* Falling rain streaks */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {RAIN_STREAKS.map((s) => (
          <span
            key={s.id}
            className="animate-rain absolute top-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
            style={{
              left: `${s.left}%`,
              height: `${s.height}px`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Faint glass condensation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, white 0.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, white 0.5px, transparent 1.5px), radial-gradient(circle at 45% 80%, white 0.5px, transparent 1.5px)',
          backgroundSize: '60px 60px, 90px 90px, 75px 75px',
        }}
      />

      {/* Dark overlay so foreground widgets pop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-forest/40"
      />

      {/* ---------------------------------------------------------------- *
       * Foreground content
       * ---------------------------------------------------------------- */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Header />

        {/* Stacked on mobile; 3 columns at ~900px+ with the timer centered. */}
        <div className="grid grid-cols-1 items-start gap-6 min-[900px]:grid-cols-3">
          <BookNook />
          <PomodoroTimer />
          <MindsGarden />
        </div>

        <footer className="mt-12 text-center text-sm text-cream/60">
          Made with care for Emily. Be gentle with yourself today. 🤍
        </footer>
      </main>
    </div>
  )
}
