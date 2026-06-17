import { useState } from 'react'
import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import { PLANTS, PAL } from '../pixel/sprites.js'
import { FACTS } from '../data/facts.js'

const MAX_PLANTS = 12

/**
 * Widget 3 — The Mind's Garden (lofi window).
 * "Water the Mind" grows a random pixel plant from a CSS pot and shows a fact.
 * Plants sway in a gentle breeze and accumulate across the session.
 */
export default function MindsGarden() {
  const [plants, setPlants] = useState([]) // { id, sprite }
  const [lastId, setLastId] = useState(null)
  const [fact, setFact] = useState(null)
  const [rippleKey, setRippleKey] = useState(0)
  const [rippling, setRippling] = useState(false)

  function water() {
    const id = Date.now() + Math.random()
    const sprite = Math.floor(Math.random() * PLANTS.length)
    setLastId(id)
    setPlants((prev) => {
      const next = [...prev, { id, sprite }]
      return next.length > MAX_PLANTS ? next.slice(next.length - MAX_PLANTS) : next
    })
    setFact(FACTS[Math.floor(Math.random() * FACTS.length)])
    setRippleKey((k) => k + 1)
    setRippling(true)
    setTimeout(() => setRippling(false), 620)
  }

  return (
    <WindowFrame title="Mind's Garden" bodyClass="bg-cream">
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center font-display text-lg text-brown">
          🪴 Tend to your mind
        </p>

        {/* Garden stage */}
        <div className="flex w-full flex-col items-center">
          {/* Plant display area */}
          <div className="flex min-h-[4.5rem] w-full flex-wrap items-end justify-center gap-x-1.5 pb-1" aria-hidden="true">
            {plants.map((plant, idx) => (
              <span
                key={plant.id}
                className="inline-block origin-bottom"
                style={plant.id === lastId ? { animation: 'pixelPop 0.55s cubic-bezier(0.18,0.89,0.32,1.28) forwards' } : {}}
              >
                <span
                  className="inline-block origin-bottom"
                  style={{ animation: `sway 3.6s ease-in-out ${idx * 0.4}s infinite` }}
                >
                  <PixelSprite grid={PLANTS[plant.sprite]} palette={PAL} pixel={4} />
                </span>
              </span>
            ))}
          </div>

          {/* CSS terracotta pot */}
          <div aria-hidden="true" className="relative flex flex-col items-center">
            <div className="relative h-5 w-32 overflow-hidden rounded-t-lg bg-brown shadow-inner">
              <div className="absolute left-3 top-1 h-2 w-1.5 rounded-full bg-white/25" />
            </div>
            <div
              className="relative h-16 w-28 overflow-hidden"
              style={{ background: '#8F5E36', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}
            >
              <div className="absolute inset-x-0 top-0 h-3 bg-brownDark" style={{ clipPath: 'polygon(0 0, 100% 0, 93% 100%, 7% 100%)' }} />
              <div className="absolute bottom-2 left-4 top-4 w-2 rounded-full bg-white/18" />
            </div>
            <div className="h-1.5 w-24 rounded-full bg-black/20 blur-sm" />
          </div>
        </div>

        {/* Water button with ripple */}
        <div className="relative mt-5 inline-block font-display">
          {rippling && (
            <span key={rippleKey} aria-hidden="true" className="animate-ripple-water pointer-events-none absolute inset-0 rounded-2xl bg-ever-aqua/50" />
          )}
          <button
            onClick={water}
            className="relative min-h-[44px] rounded-2xl bg-ever-aqua px-6 py-2.5 text-bg0 shadow-sm transition-colors hover:bg-ever-green active:scale-95"
          >
            💧 Water the Mind
          </button>
        </div>

        <p className="mt-4 min-h-[3.5rem] max-w-xs text-center text-sm leading-relaxed text-brown" aria-live="polite">
          {fact ?? 'Give it a little water to see what grows. 🌧️'}
        </p>
      </div>
    </WindowFrame>
  )
}
