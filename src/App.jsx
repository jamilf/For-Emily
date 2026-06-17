import Header from './components/Header.jsx'
import BookNook from './components/BookNook.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import MindsGarden from './components/MindsGarden.jsx'
import SkyScene from './scene/SkyScene.jsx'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Painterly Ghibli landscape (fixed; content scrolls over it) */}
      <SkyScene />

      {/* Faint lo-fi film grain over the whole scene */}
      <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-[1]" />

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

        <footer className="mt-12 text-center font-display text-sm text-cream/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          Made with care for Emily. Be gentle with yourself today. 🤍
        </footer>
      </main>
    </div>
  )
}
