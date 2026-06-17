import { useEffect, useRef } from 'react'
import WeatherEngine from '../weather/WeatherEngine.js'
import { useMixer } from '../audio/AudioMixerProvider.jsx'

/**
 * Full-screen weather layer. Sits above the painterly sky, below the UI
 * (z-[2], pointer-events-none). Rain + thunder intensity track the ambient
 * mixer's "Steady Rain" and "Distant Thunder" sliders.
 */
export default function WeatherCanvas() {
  const canvasRef = useRef(null)
  const flashRef = useRef(null)
  const engineRef = useRef(null)
  const { levels } = useMixer()

  // Create the engine once.
  useEffect(() => {
    const engine = new WeatherEngine(canvasRef.current, flashRef.current)
    engineRef.current = engine

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    engine.setReducedMotion(mq.matches)
    const onMq = (e) => engine.setReducedMotion(e.matches)
    mq.addEventListener('change', onMq)

    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize, { passive: true })

    const onVisibility = () => {
      if (document.hidden) engine.stop()
      else if (!mq.matches) engine.start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      engine.stop()
    }
  }, [])

  // Feed live slider values to the engine (it wakes/sleeps itself).
  useEffect(() => {
    engineRef.current?.setLevels({ rain: levels.steadyRain ?? 0, thunder: levels.thunder ?? 0 })
  }, [levels.steadyRain, levels.thunder])

  return (
    <div aria-hidden="true" className="weather-layer pointer-events-none fixed inset-0 z-[2]">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div
        ref={flashRef}
        className="absolute inset-0 bg-white"
        style={{ opacity: 0, transition: 'opacity 120ms linear' }}
      />
    </div>
  )
}
