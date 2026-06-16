import { useState } from 'react'
import { FACTS } from '../data/facts.js'

const PLANT_EMOJIS = ['🌱', '🌿', '🌸', '🍄', '🌻']

/**
 * Widget 3 — The Mind's Garden.
 * "Water the Mind" grows a random plant out of a pure-CSS terracotta pot and
 * shows a random fact. Plants accumulate across the session for a small,
 * rewarding garden.
 */
export default function MindsGarden() {
  const [plants, setPlants] = useState([]) // { id, emoji, left }
  const [fact, setFact] = useState(null)

  function water() {
    const emoji = PLANT_EMOJIS[Math.floor(Math.random() * PLANT_EMOJIS.length)]
    // Scatter plants a little so they don't perfectly overlap.
    const left = 20 + Math.random() * 60
    setPlants((prev) => [...prev, { id: Date.now() + Math.random(), emoji, left }])
    setFact(FACTS[Math.floor(Math.random() * FACTS.length)])
  }

  return (
    <section
      aria-label="The Mind's Garden"
      className="flex flex-col items-center rounded-3xl bg-cream p-6 text-brownDark shadow-cozy"
    >
      <h2 className="mb-1 font-serif text-2xl font-semibold">
        The Mind&apos;s Garden <span aria-hidden="true">🪴</span>
      </h2>
      <p className="mb-4 text-center text-sm text-brown">
        Tend to your mind — one little drop at a time.
      </p>

      {/* Stage: plants grow up out of the pot below. */}
      <div className="relative flex h-48 w-full items-end justify-center">
        {/* Plants accumulating from the soil */}
        <div className="absolute bottom-12 left-0 right-0 flex h-32 items-end justify-center">
          {plants.map((plant) => (
            <span
              key={plant.id}
              className="animate-plant-grow absolute bottom-0 origin-bottom text-3xl"
              style={{ left: `${plant.left}%` }}
              aria-hidden="true"
            >
              {plant.emoji}
            </span>
          ))}
        </div>

        {/* Pure-CSS terracotta pot */}
        <div aria-hidden="true" className="relative z-10 flex flex-col items-center">
          {/* Rim */}
          <div className="h-5 w-28 rounded-t-md bg-brown shadow-inner" />
          {/* Tapered body via a trapezoid (border trick) */}
          <div
            className="h-16 w-24"
            style={{
              background: '#8F5E36',
              clipPath: 'polygon(0 0, 100% 0, 86% 100%, 14% 100%)',
            }}
          />
          {/* Soil peeking at the top of the body */}
          <div className="absolute top-5 h-2.5 w-24 rounded-sm bg-brownDark" />
        </div>
      </div>

      <button
        onClick={water}
        className="mt-5 rounded-2xl bg-ever-aqua px-6 py-2.5 font-medium text-forest shadow-sm transition-colors hover:bg-ever-green"
      >
        💧 Water the Mind
      </button>

      {/* Fact appears below the pot. */}
      <p
        className="mt-4 min-h-[3rem] max-w-xs text-center text-sm leading-relaxed text-brown"
        aria-live="polite"
      >
        {fact ?? 'Give it a little water to see what grows. 🌧️'}
      </p>
    </section>
  )
}
