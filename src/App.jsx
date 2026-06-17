import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import ParkingLot from './components/ParkingLot.jsx'
import FocusMeter from './components/FocusMeter.jsx'
import FocusGarden from './components/FocusGarden.jsx'
import Dock from './components/Dock.jsx'
import WeatherCanvas from './components/WeatherCanvas.jsx'
import SkyScene from './scene/SkyScene.jsx'
import AudioMixerProvider, { useMixer } from './audio/AudioMixerProvider.jsx'
import usePersistedState from './hooks/useLocalStorage.js'
import usePageHidden from './hooks/usePageHidden.js'
import { SEED_CARDS, countDue } from './data/flashcards.js'
import { migrate } from './storage/StorageManager.js'

// On-demand overlays — split into their own chunks so they stay out of the
// initial bundle until the user actually opens them.
const Flashcards = lazy(() => import('./components/Flashcards.jsx'))
const AmbientMixerDrawer = lazy(() => import('./components/AmbientMixerDrawer.jsx'))
const BrainDumpDrawer = lazy(() => import('./components/BrainDumpDrawer.jsx'))

function Dashboard() {
  const [focusMode, setFocusMode] = useState(false) // manual single-task toggle
  const [focusActive, setFocusActive] = useState(false) // a focus session is running
  const [showCards, setShowCards] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(null)
  const [zen, setZen] = usePersistedState('emily.zen', false)
  const [cards] = usePersistedState('emily.flashcards', SEED_CARDS)
  const dueCount = countDue(cards)
  const { enabled: mixerEnabled } = useMixer()
  const pageHidden = usePageHidden()

  // In focus mode the supporting rail recedes so the timer is the single point
  // of focus.
  const railRecede = focusMode
    ? 'pointer-events-none scale-[0.98] opacity-30 blur-[1px] transition-all duration-500'
    : 'transition-all duration-500'

  function toggleDrawer(id) {
    setOpenDrawer((cur) => (cur === id ? null : id))
  }

  function toggleZen() {
    setZen((z) => {
      if (!z) setOpenDrawer(null) // entering zen closes panels
      return !z
    })
  }

  const closeDrawer = () => setOpenDrawer(null)

  const rootClass = [
    'app-root relative min-h-screen overflow-hidden',
    focusActive ? 'focus-active' : '',
    zen ? 'zen' : '',
    pageHidden ? 'anims-paused' : '', // freeze decorative animations when tab is hidden
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {/* Painterly Ghibli landscape (fixed; content scrolls over it) */}
      <SkyScene />

      {/* Dynamic weather, above the scene and below the UI */}
      <WeatherCanvas />

      {/* Faint lo-fi film grain over the whole scene */}
      <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-[1]" />

      {/* Foreground */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Header
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onOpenFlashcards={() => setShowCards(true)}
          dueCount={dueCount}
        />

        {/* Hero timer + supporting rail.
            Mobile: single stacked column.
            Tablet: timer on top, meter + garden side-by-side beneath.
            Desktop: timer hero (left) with the rail stacked alongside (right). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-stretch">
          <div
            className={`animate-slide-up flex transition-transform duration-500 ${focusMode ? 'lg:scale-[1.01]' : ''}`}
            style={{ animationDelay: '0ms' }}
          >
            <PomodoroTimer onFocusActive={setFocusActive} className="w-full" />
          </div>

          <aside className={`grid grid-cols-1 gap-6 min-[640px]:grid-cols-2 lg:flex lg:flex-col ${railRecede}`}>
            <div className="focus-dim animate-slide-up flex" style={{ animationDelay: '150ms' }}>
              <FocusMeter className="w-full" />
            </div>
            <div className="animate-slide-up flex lg:flex-1" style={{ animationDelay: '260ms' }}>
              <FocusGarden className="w-full" />
            </div>
          </aside>
        </div>

        <footer className="mb-24 mt-12 text-center font-display text-sm text-cream/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          Made with care for Emily. Be gentle with yourself today. 🤍
        </footer>
      </main>

      {/* Always-available distraction parking lot */}
      <ParkingLot />

      {/* Control dock + feature drawers */}
      <Dock
        openDrawer={openDrawer}
        onToggle={toggleDrawer}
        zen={zen}
        onToggleZen={toggleZen}
        mixerEnabled={mixerEnabled}
      />
      <Suspense fallback={null}>
        {openDrawer === 'mixer' && <AmbientMixerDrawer onClose={closeDrawer} />}
        {openDrawer === 'brainDump' && <BrainDumpDrawer onClose={closeDrawer} />}

        {/* Flashcards overlay */}
        {showCards && <Flashcards onClose={() => setShowCards(false)} />}
      </Suspense>
    </div>
  )
}

export default function App() {
  // Stamp the storage schema version once on boot.
  useEffect(() => {
    migrate()
  }, [])

  return (
    <AudioMixerProvider>
      <Dashboard />
    </AudioMixerProvider>
  )
}
