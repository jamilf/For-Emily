import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import BookNook from './components/BookNook.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import MindsGarden from './components/MindsGarden.jsx'
import ParkingLot from './components/ParkingLot.jsx'
import Flashcards from './components/Flashcards.jsx'
import FocusMeter from './components/FocusMeter.jsx'
import FocusGarden from './components/FocusGarden.jsx'
import Dock from './components/Dock.jsx'
import AmbientMixerDrawer from './components/AmbientMixerDrawer.jsx'
import BrainDumpDrawer from './components/BrainDumpDrawer.jsx'
import StudyPartnerDrawer from './components/StudyPartnerDrawer.jsx'
import SpotifyDrawer from './components/SpotifyDrawer.jsx'
import WeatherCanvas from './components/WeatherCanvas.jsx'
import SkyScene from './scene/SkyScene.jsx'
import AudioMixerProvider, { useMixer } from './audio/AudioMixerProvider.jsx'
import usePersistedState from './hooks/useLocalStorage.js'
import { SEED_CARDS, countDue } from './data/flashcards.js'
import { migrate } from './storage/StorageManager.js'

function Dashboard() {
  const [focusMode, setFocusMode] = useState(false) // manual single-task toggle
  const [focusActive, setFocusActive] = useState(false) // a focus session is running
  const [showCards, setShowCards] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(null)
  const [mediaSeen, setMediaSeen] = useState({ partner: false, spotify: false })
  const [zen, setZen] = usePersistedState('emily.zen', false)
  const [cards] = usePersistedState('emily.flashcards', SEED_CARDS)
  const dueCount = countDue(cards)
  const { enabled: mixerEnabled } = useMixer()

  // In focus mode the side cards recede so the timer is the single point of focus.
  const sideClass = focusMode
    ? 'pointer-events-none scale-95 opacity-30 blur-[1px] transition-all duration-500'
    : 'transition-all duration-500'

  function toggleDrawer(id) {
    if (id === 'partner' || id === 'spotify') {
      setMediaSeen((m) => ({ ...m, [id]: true }))
    }
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

        <div className="grid grid-cols-1 items-start gap-5 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 sm:gap-6">
          <div className={`focus-dim animate-slide-up order-2 min-[640px]:order-2 min-[900px]:order-1 ${sideClass}`} style={{ animationDelay: '150ms' }}>
            <BookNook />
          </div>
          <div
            className={`animate-slide-up order-1 min-[640px]:order-1 min-[640px]:col-span-2 min-[900px]:order-2 min-[900px]:col-span-1 transition-all duration-500 ${
              focusMode ? 'scale-[1.02]' : ''
            }`}
            style={{ animationDelay: '0ms' }}
          >
            <PomodoroTimer onFocusActive={setFocusActive} />
          </div>
          <div className={`focus-dim animate-slide-up order-3 min-[640px]:order-3 min-[900px]:order-3 ${sideClass}`} style={{ animationDelay: '300ms' }}>
            <MindsGarden />
          </div>
        </div>

        {/* Garden + positive-reinforcement dashboard */}
        <div className="mt-6 grid grid-cols-1 gap-5 min-[900px]:grid-cols-2 sm:gap-6">
          <div className="focus-dim animate-slide-up" style={{ animationDelay: '200ms' }}>
            <FocusMeter />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '260ms' }}>
            <FocusGarden />
          </div>
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
      {openDrawer === 'mixer' && <AmbientMixerDrawer onClose={closeDrawer} />}
      {openDrawer === 'brainDump' && <BrainDumpDrawer onClose={closeDrawer} />}
      {mediaSeen.partner && <StudyPartnerDrawer open={openDrawer === 'partner'} onClose={closeDrawer} />}
      {mediaSeen.spotify && <SpotifyDrawer open={openDrawer === 'spotify'} onClose={closeDrawer} />}

      {/* Flashcards overlay */}
      {showCards && <Flashcards onClose={() => setShowCards(false)} />}
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
