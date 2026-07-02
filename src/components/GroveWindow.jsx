import { memo, useEffect, useMemo, useRef } from 'react'
import { useMixerSafe } from '../audio/AudioMixerProvider.jsx'
import useUiPrefs from '../hooks/useUiPrefs.js'
import WeatherEngine from '../weather/WeatherEngine.js'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { PLANTS, PAL } from '../pixel/sprites.js'
import { deriveScene } from '../data/sceneState.js'

/**
 * GroveWindow — the timer card's living diorama strip. One composed scene, back to
 * front: a sky that follows the real part of day (the story hook's daypart, never a
 * second time system), a low horizon band of pixel flora, weather driven by the SAME
 * mixer sliders as the global WeatherCanvas (a second WeatherEngine instance scoped
 * to this card: shared code, self-idling, tab-hidden aware), and the children the
 * timer anchors into the world (the session tree, the companion).
 *
 * Fully derived: nothing here is persisted. Decorative layers are aria-hidden; the
 * children keep their own semantics. Under reduced motion the engine paints its
 * static calm frame and everything else is already still.
 */

// Fixed, deterministic flora spots along the horizon (reusing the existing PLANTS
// sprites): a fern, a flower, a sprout. Positions are stable so the grove feels
// like a place, not a shuffle.
const FLORA = [
  { grid: 1, className: 'bottom-2 left-3' },
  { grid: 0, className: 'bottom-2 left-[22%]' },
  { grid: 2, className: 'bottom-2 right-4' },
]

// Twelve fixed firefly spots (matching the FIREFLY_CAP): they appear one by one as
// the session progresses and hold; positions never shuffle mid-session.
const FIREFLY_SPOTS = [
  [16, 58],
  [78, 44],
  [34, 36],
  [62, 62],
  [8, 40],
  [88, 58],
  [46, 30],
  [70, 26],
  [24, 70],
  [54, 48],
  [90, 34],
  [12, 24],
]

function GroveWindow({
  partOfDay = 'day',
  phase = null,
  fireflies = 0,
  warmth = 0,
  className = '',
  children,
}) {
  const mixer = useMixerSafe()
  const { reduced, instantMotion } = useUiPrefs()
  const rain = mixer?.levels?.steadyRain ?? 0
  const thunder = mixer?.levels?.thunder ?? 0

  const scene = useMemo(
    () => deriveScene({ partOfDay, mixer: { levels: { steadyRain: rain, thunder } } }),
    [partOfDay, rain, thunder],
  )

  const canvasRef = useRef(null)
  const flashRef = useRef(null)
  const engineRef = useRef(null)

  // The card-scoped weather engine: the scene's single rAF owner. It self-idles at
  // zero levels, pauses when the tab hides, and paints a static frame under reduced
  // motion (all built into the shared engine).
  useEffect(() => {
    const engine = new WeatherEngine(canvasRef.current, flashRef.current, { fitParent: true })
    engineRef.current = engine
    engine.setReducedMotion(reduced)
    const onResize = () => engine.resize()
    const onVisibility = () => {
      if (document.hidden) engine.stop()
      else if (!reduced) engine.start()
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      engine.stop()
      engineRef.current = null
    }
  }, [reduced])

  useEffect(() => {
    // Softer in-card density than the full-viewport canvas (same sliders, smaller sky).
    engineRef.current?.setLevels({ rain: scene.weather.rain * 0.45, thunder: scene.weather.thunder })
  }, [scene.weather.rain, scene.weather.thunder])

  const { skyRamp } = scene

  return (
    <div
      data-daypart={scene.daypart}
      data-phase={phase || undefined}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Sky */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${skyRamp.top} 0%, ${skyRamp.mid} 55%, ${skyRamp.horizon} 100%)`,
          transition: 'background 1200ms ease',
        }}
      />
      {/* A few still stars once the light goes */}
      {(scene.daypart === 'night' || scene.daypart === 'dusk') && (
        <div aria-hidden="true" className="absolute inset-0">
          {[
            [12, 18],
            [30, 8],
            [55, 22],
            [72, 12],
            [88, 26],
          ].map(([left, top]) => (
            <span
              key={`${left}-${top}`}
              className="absolute h-0.5 w-0.5 rounded-full bg-cream/80"
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          ))}
        </div>
      )}
      {/* Horizon ground band */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-5"
        style={{ background: scene.ground, transition: 'background 1200ms ease' }}
      />
      {/* Horizon flora (existing PLANTS sprites, fixed spots) */}
      {FLORA.map((f) => (
        <div key={f.className} aria-hidden="true" className={`absolute ${f.className}`}>
          <PixelSprite grid={PLANTS[f.grid]} palette={PAL} pixel={2} />
        </div>
      ))}
      {/* Weather, scoped to the card (same engine as the global canvas) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full" />
        <div
          ref={flashRef}
          className="absolute inset-0 bg-white"
          style={{ opacity: 0, transition: 'opacity 120ms linear' }}
        />
      </div>
      {/* Session warmth: the light blooms gold as completion approaches (fully
          golden in the final minute). Opacity-only, so it never costs layout. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 85%, rgba(255,210,125,0.5), transparent 72%)',
          opacity: warmth,
          transition: 'opacity 2000ms ease',
        }}
      />
      {/* Fireflies gather one by one at fixed spots and hold (never fewer). Drift is
          a transform/opacity loop, dropped entirely under Minimal effects. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FIREFLY_SPOTS.map(([left, top], i) => {
          const lit = i < fireflies
          return (
            <span
              key={`${left}-${top}`}
              // The drift animation only runs on lit dots (a CSS animation would
              // override the inline opacity that keeps unlit dots invisible).
              className={`gw-dot absolute h-1 w-1 rounded-full bg-ever-yellow ${
                lit && !instantMotion ? 'gw-firefly' : ''
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                opacity: lit ? 0.8 : 0,
                transition: 'opacity 1200ms ease',
                boxShadow: '0 0 4px 1px rgba(219,188,127,0.8)',
                animationDelay: `${(i % 6) * 0.7}s`,
              }}
            />
          )
        })}
      </div>
      {/* The world's inhabitants: the session tree and the companion */}
      <div className="relative flex h-full items-end justify-center gap-10 px-4 pb-1">{children}</div>
    </div>
  )
}

export default memo(GroveWindow)
