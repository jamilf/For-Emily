import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import { generate } from '../pixel/PlantGenerator.js'

/**
 * Feature 3 (display) — My Garden. A responsive grid of trees harvested from
 * completed focus sessions. Each is rendered from its saved DNA, so it always
 * looks the same. Persists forever unless cleared.
 */
export default function FocusGarden() {
  const [garden, setGarden] = usePersistedState('emily.garden', [])

  return (
    <WindowFrame title="My Garden">
      {garden.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-display text-lg text-brown">Your garden is waiting 🌱</p>
          <p className="mt-1 text-sm text-brown/60">
            Finish a focus session and a tree will grow here — one for every session you complete.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 min-[480px]:grid-cols-6 sm:grid-cols-8">
            {garden.map((tree) => {
              const { grid, palette } = generate(tree.id, 'mature')
              return (
                <div key={tree.ts} className="flex items-end justify-center" title={new Date(tree.ts).toLocaleDateString()}>
                  <PixelSprite grid={grid} palette={palette} pixel={3} />
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-brown/60">
              {garden.length} {garden.length === 1 ? 'tree' : 'trees'} grown 🌳
            </p>
            <button
              onClick={() => {
                if (confirm('Clear your whole garden? This cannot be undone.')) setGarden([])
              }}
              className="rounded-lg px-2 py-1 text-xs text-brown/50 underline-offset-2 hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
            >
              Clear garden
            </button>
          </div>
        </>
      )}
    </WindowFrame>
  )
}
