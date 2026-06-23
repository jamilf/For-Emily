import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import BrainDump from './components/BrainDump.jsx'
import FocusMeter from './components/FocusMeter.jsx'
import FocusGarden from './components/FocusGarden.jsx'
import Dock from './components/Dock.jsx'
import WeatherCanvas from './components/WeatherCanvas.jsx'
import SeasonLayer from './components/SeasonLayer.jsx'
import ThemeLayer from './scene/ThemeLayer.jsx'
import SkyScene from './scene/SkyScene.jsx'
import WindowSill from './scene/WindowSill.jsx'
import { seasonForHarvest } from './data/seasons.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import AudioMixerProvider, { useMixer } from './audio/AudioMixerProvider.jsx'
import SyncProvider from './sync/SyncProvider.jsx'
import usePersistedState from './hooks/useLocalStorage.js'
import usePageHidden from './hooks/usePageHidden.js'
import useParallax from './hooks/useParallax.js'
import useStory from './hooks/useStory.js'
import SpriteGreeting from './components/SpriteGreeting.jsx'
import ChapterReveal from './components/ChapterReveal.jsx'
import LetterReveal from './components/LetterReveal.jsx'
import { SEED_CARDS, countDue } from './data/flashcards.js'
import { migrate } from './storage/StorageManager.js'

// On-demand overlays — split into their own chunks so they stay out of the
// initial bundle until the user actually opens them.
const Flashcards = lazy(() => import('./components/Flashcards.jsx'))
const AmbientMixerDrawer = lazy(() => import('./components/AmbientMixerDrawer.jsx'))
const GuideModal = lazy(() => import('./components/GuideModal.jsx'))
const SyncModal = lazy(() => import('./components/SyncModal.jsx'))
const GroveAlmanac = lazy(() => import('./components/GroveAlmanac.jsx'))
const Journal = lazy(() => import('./components/Journal.jsx'))
const Constellations = lazy(() => import('./components/Constellations.jsx'))
const SeasonsModal = lazy(() => import('./components/SeasonsModal.jsx'))
const ThemesModal = lazy(() => import('./components/ThemesModal.jsx'))
const QuestBoard = lazy(() => import('./components/QuestBoard.jsx'))
const StoryModal = lazy(() => import('./components/StoryModal.jsx'))
const ForestSpiritsModal = lazy(() => import('./components/ForestSpiritsModal.jsx'))
const MemoryGroveModal = lazy(() => import('./components/MemoryGroveModal.jsx'))
const GroveHub = lazy(() => import('./components/GroveHub.jsx'))
const ComebackMoment = lazy(() => import('./components/ComebackMoment.jsx'))

function Dashboard() {
  const [focusMode, setFocusMode] = useState(false) // manual single-task toggle
  const [focusActive, setFocusActive] = useState(false) // a focus session is running
  const [showCards, setShowCards] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [showGrove, setShowGrove] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [showConstellations, setShowConstellations] = useState(false)
  const [showSeasons, setShowSeasons] = useState(false)
  const [showThemes, setShowThemes] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showStory, setShowStory] = useState(false)
  const [showSpirits, setShowSpirits] = useState(false)
  const [showMemories, setShowMemories] = useState(false)
  const [showHub, setShowHub] = useState(false)

  // The Grove hub launches each world surface (so the toolbar stays calm).
  const openFromHub = (key) => {
    const open = {
      story: setShowStory,
      almanac: setShowGrove,
      spirits: setShowSpirits,
      memories: setShowMemories,
      seasons: setShowSeasons,
      themes: setShowThemes,
      constellations: setShowConstellations,
      journal: setShowJournal,
    }[key]
    open?.(true)
  }
  const [openDrawer, setOpenDrawer] = useState(null)
  const story = useStory()
  const [zen, setZen] = usePersistedState('emily.zen', false)
  const [cards] = usePersistedState('emily.flashcards', SEED_CARDS)
  const [garden] = usePersistedState('emily.garden', [])
  const dueCount = countDue(cards)
  // The sanctuary's season is derived from the total trees grown — nothing new is stored.
  const season = useMemo(() => seasonForHarvest(garden.length), [garden.length])
  const { enabled: mixerEnabled } = useMixer()
  const pageHidden = usePageHidden()
  useParallax() // publishes pointer/scroll depth vars for the scene bands

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
    // 100dvh (not 100vh) so the iOS URL bar showing/hiding can't clip the page; a
    // top safe-area inset keeps flow content clear of the notch (0 on other devices).
    'app-root relative min-h-[100dvh] overflow-hidden pt-[env(safe-area-inset-top)]',
    focusActive ? 'focus-active' : '',
    zen ? 'zen' : '',
    pageHidden ? 'anims-paused' : '', // freeze decorative animations when tab is hidden
    `season-${season.id}`,
    `tod-${story.partOfDay}`, // shifts the daylight veil with her local time of day
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-lg bg-brown px-4 py-2 font-display text-sm text-cream focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      {/* Painterly Ghibli landscape (fixed; content scrolls over it) */}
      <SkyScene />

      {/* Seasonal tint + ambient drift, behind the content (decorative) */}
      <SeasonLayer season={season} />

      {/* Cosmetic scene theme tint — unlocked as the grove grows, chosen by Emily */}
      <ThemeLayer />

      {/* Dynamic weather, above the scene and below the UI */}
      <WeatherCanvas />

      {/* Daylight veil — a soft tint that shifts with the local time of day (set by
          the tod-* class on the root). Decorative, sits over the scene, never over text. */}
      <div aria-hidden="true" className="daylight-veil pointer-events-none fixed inset-0 z-[1]" />

      {/* Faint lo-fi film grain over the whole scene */}
      <div aria-hidden="true" className="film-grain pointer-events-none fixed inset-0 z-[1]" />

      {/* Cozy windowsill frame — the nearest layer; the scene parallaxes behind it */}
      <WindowSill />

      {/* Foreground */}
      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Header
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((f) => !f)}
          onOpenFlashcards={() => setShowCards(true)}
          onOpenGuide={() => setShowGuide(true)}
          onOpenSync={() => setShowSync(true)}
          onOpenQuests={() => setShowQuests(true)}
          onOpenGrove={() => setShowHub(true)}
          dueCount={dueCount}
        />

        {/* Hero timer + supporting rail.
            Mobile: single stacked column.
            Tablet: timer on top, meter + garden side-by-side beneath.
            Desktop: timer hero (left) with the rail stacked alongside (right). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-stretch">
          <div
            className={`animate-slide-up flex flex-col gap-3 transition-transform duration-500 ${focusMode ? 'lg:scale-[1.01]' : ''}`}
            style={{ animationDelay: '0ms' }}
          >
            {dueCount > 0 && !focusMode && (
              <button
                onClick={() => setShowCards(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brownDark/30 bg-cream/85 px-4 py-2.5 font-display text-sm text-brown shadow-sm transition-all hover:bg-cream active:scale-[0.99] sm:backdrop-blur-sm"
              >
                <span aria-hidden="true">🃏</span>
                Review {dueCount} card{dueCount === 1 ? '' : 's'} due today
              </button>
            )}
            <PomodoroTimer
              onFocusActive={setFocusActive}
              reviewDue={dueCount}
              onReviewCards={() => setShowCards(true)}
              className="w-full"
            />
          </div>

          <aside
            className={`grid grid-cols-1 gap-6 min-[640px]:grid-cols-2 lg:flex lg:flex-col ${railRecede}`}
          >
            <div className="focus-dim animate-slide-up flex" style={{ animationDelay: '150ms' }}>
              <FocusMeter className="w-full" />
            </div>
            <div className="animate-slide-up flex lg:flex-1" style={{ animationDelay: '260ms' }}>
              <FocusGarden
                className="w-full"
                onOpenAlmanac={() => setShowGrove(true)}
                onOpenSpirits={() => setShowSpirits(true)}
                onOpenMemories={() => setShowMemories(true)}
              />
            </div>
          </aside>
        </div>

        <footer className="mb-24 mt-12 text-center font-display text-sm text-cream/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          For Emily Tran. You&apos;ve got this.
        </footer>
      </main>

      {/* Always-available floating notepad */}
      <BrainDump />

      {/* Control dock + feature drawers */}
      <Dock
        openDrawer={openDrawer}
        onToggle={toggleDrawer}
        zen={zen}
        onToggleZen={toggleZen}
        mixerEnabled={mixerEnabled}
        onOpenFlashcards={() => setShowCards(true)}
        flashcardsDue={dueCount}
      />
      <Suspense fallback={null}>
        {openDrawer === 'mixer' && <AmbientMixerDrawer onClose={closeDrawer} />}

        {/* Flashcards overlay */}
        {showCards && <Flashcards onClose={() => setShowCards(false)} />}

        {/* How-to / why-it-helps guide */}
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

        {/* Cross-device sync */}
        {showSync && <SyncModal onClose={() => setShowSync(false)} />}

        {/* Grove Almanac — tree collection */}
        {showGrove && <GroveAlmanac onClose={() => setShowGrove(false)} />}

        {/* Journal — a derived timeline of meaningful moments */}
        {showJournal && <Journal onClose={() => setShowJournal(false)} />}

        {/* Constellations — a derived night-sky view of progress */}
        {showConstellations && <Constellations onClose={() => setShowConstellations(false)} />}

        {/* Sanctuary Seasons — a derived field guide to the growing world */}
        {showSeasons && <SeasonsModal onClose={() => setShowSeasons(false)} />}

        {/* Scene Themes — cosmetic skies unlocked by growth */}
        {showThemes && <ThemesModal onClose={() => setShowThemes(false)} />}

        {/* Focus Quest Board — derived daily objectives, nothing to fail */}
        {showQuests && <QuestBoard onClose={() => setShowQuests(false)} />}

        {/* Grove Story — a derived, comeback-positive narrative layer */}
        {showStory && <StoryModal onClose={() => setShowStory(false)} />}

        {/* Forest Spirits + Memory Grove — owned here so the Grove hub can open them */}
        {showSpirits && <ForestSpiritsModal onClose={() => setShowSpirits(false)} />}
        {showMemories && <MemoryGroveModal onClose={() => setShowMemories(false)} />}

        {/* The Grove — one companion-led launcher for every world surface */}
        {showHub && <GroveHub onClose={() => setShowHub(false)} onOpen={openFromHub} />}

        {/* Welcome-back moment after a gap — a gift, shown once per day */}
        {story.comeback && (
          <ComebackMoment
            comeback={story.comeback}
            companionName={story.companionName}
            onClose={story.dismissComeback}
          />
        )}
      </Suspense>

      {/* The sprite's contextual hello + gentle reveals. Priority: the welcome-back
          moment first, then a chapter reveal, then a milestone letter, then the
          greeting — so at most one ambient announcement appears at a time. */}
      {!story.comeback && story.unseenChapter && (
        <ChapterReveal
          chapter={story.unseenChapter}
          onRead={() => setShowStory(true)}
          onAck={story.ackChapter}
        />
      )}
      {!story.comeback && !story.unseenChapter && story.unseenLetter && (
        <LetterReveal
          letter={story.unseenLetter}
          companionName={story.companionName}
          onRead={() => setShowStory(true)}
          onAck={story.ackLetter}
        />
      )}
      {!story.comeback && !story.unseenChapter && !story.unseenLetter && story.greeting && (
        <SpriteGreeting
          text={story.greeting}
          companionName={story.companionName}
          onName={story.setCompanionName}
        />
      )}
    </div>
  )
}

export default function App() {
  // Stamp the storage schema version once on boot.
  useEffect(() => {
    migrate()
  }, [])

  return (
    <ErrorBoundary>
      <SyncProvider>
        <AudioMixerProvider>
          <Dashboard />
        </AudioMixerProvider>
      </SyncProvider>
    </ErrorBoundary>
  )
}
