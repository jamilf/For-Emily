import { useState } from 'react'
import { FACTS } from '../data/facts.js'

const PLANT_EMOJIS = ['🌱', '🌿', '🌸', '🍄', '🌻']
const PLANT_SIZES  = ['1.9rem', '2.2rem', '2.5rem', '2rem', '2.4rem']
const MAX_PLANTS   = 14

/**
 * Widget 3 — The Mind's Garden.
 * "Water the Mind" grows a random plant from a pure-CSS terracotta pot and
 * shows a random fact. Plants sway in a gentle breeze and accumulate.
 */
export default function MindsGarden() {
  const [plants, setPlants] = useState([])
  const [lastId, setLastId] = useState(null)
  const [fact, setFact] = useState(null)
  const [rippleKey, setRippleKey] = useState(0)
  const [rippling, setRippling] = useState(false)

  function water() {
    const id = Date.now() + Math.random()
    const emoji = PLANT_EMOJIS[Math.floor(Math.random() * PLANT_EMOJIS.length)]
    const size  = PLANT_SIZES[Math.floor(Math.random() * PLANT_SIZES.length)]
    setLastId(id)
    setPlants((prev) => {
      const next = [...prev, { id, emoji, size }]
      // Cap the garden so it doesn't overflow; drop the oldest if needed.
      return next.length > MAX_PLANTS ? next.slice(next.length - MAX_PLANTS) : next
    })
    setFact(FACTS[Math.floor(Math.random() * FACTS.length)])
    setRippleKey((k) => k + 1)
    setRippling(true)
    setTimeout(() => setRippling(false), 620)
  }

  return (
    <section
      aria-label="The Mind's Garden"
      className="widget-glass flex flex-col items-center bg-cream/95 p-6 text-brownDark transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.015]"
    >
      <h2 className="mb-0.5 font-serif text-2xl font-semibold">
        The Mind&apos;s Garden <span aria-hidden="true">🪴</span>
      </h2>
      <p className="mb-4 text-center text-sm text-brown">
        Tend to your mind — one little drop at a time.
      </p>

      {/* Garden stage */}
      <div className="relative flex w-full flex-col items-center">
        {/* Plant display area — flex-wrap so plants flow naturally without overflow */}
        <div
          className="relative z-10 flex min-h-[5rem] w-full flex-wrap items-end justify-center gap-x-1 pb-1"
          aria-hidden="true"
        >
          {plants.map((plant, idx) => (
            /* Outer span handles the grow-in entrance for the newest plant;
               inner span handles the ongoing sway so the two transforms don't conflict. */
            <span
              key={plant.id}
              className="inline-block origin-bottom"
              style={
                plant.id === lastId
                  ? { animation: 'plantGrow 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards' }
                  : {}
              }
            >
              <span
                className="inline-block origin-bottom"
                style={{
                  fontSize: plant.size,
                  animation: `sway 3.5s ease-in-out ${idx * 0.4}s infinite`,
                }}
              >
                {plant.emoji}
              </span>
            </span>
          ))}
        </div>

        {/* Pure-CSS terracotta pot */}
        <div aria-hidden="true" className="relative flex flex-col items-center">
          {/* Rim */}
          <div className="relative h-5 w-32 overflow-hidden rounded-t-lg bg-brown shadow-inner">
            {/* Highlight stripe on the rim */}
            <div className="absolute left-3 top-1 h-2 w-1.5 rounded-full bg-white/25" />
          </div>

          {/* Tapered body */}
          <div
            className="relative h-16 w-28 overflow-hidden"
            style={{
              background: '#8F5E36',
              clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
            }}
          >
            {/* Soil line at the top of the body */}
            <div
              className="absolute inset-x-0 top-0 h-3 bg-brownDark"
              style={{ clipPath: 'polygon(0 0, 100% 0, 93% 100%, 7% 100%)' }}
            />
            {/* Ceramic highlight — gives it a subtle 3-D curve */}
            <div className="absolute bottom-2 left-4 top-4 w-2 rounded-full bg-white/18" />
          </div>

          {/* Pot base shadow */}
          <div className="h-1.5 w-24 rounded-full bg-black/20 blur-sm" />
        </div>
      </div>

      {/* Water button with ripple effect */}
      <div className="relative mt-5 inline-block">
        {rippling && (
          <span
            key={rippleKey}
            aria-hidden="true"
            className="animate-ripple-water pointer-events-none absolute inset-0 rounded-2xl bg-ever-aqua/50"
          />
        )}
        <button
          onClick={water}
          className="relative min-h-[44px] rounded-2xl bg-ever-aqua px-6 py-2.5 font-medium text-forest shadow-sm transition-colors hover:bg-ever-green active:scale-95"
        >
          💧 Water the Mind
        </button>
      </div>

      {/* Fact display */}
      <p
        className="mt-4 min-h-[3.5rem] max-w-xs text-center text-sm leading-relaxed text-brown"
        aria-live="polite"
      >
        {fact ?? 'Give it a little water to see what grows. 🌧️'}
      </p>
    </section>
  )
}
