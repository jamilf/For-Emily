import { lazy, Suspense, useMemo, useState } from 'react'
import WindowFrame from './WindowFrame.jsx'
import PixelSprite from '../pixel/PixelSprite.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'
import { generate } from '../pixel/PlantGenerator.js'

// The spirits collection loads on demand, not in the initial bundle.
const ForestSpiritsModal = lazy(() => import('./ForestSpiritsModal.jsx'))

/**
 * Feature 3 (display) — My Garden. A responsive grid of trees harvested from
 * completed focus sessions. Each is rendered from its saved DNA, so it always
 * looks the same. Persists forever unless cleared. Tuned to sit in the narrow
 * side rail.
 */
export default function FocusGarden({ className = '', onOpenAlmanac }) {
  const [garden, setGarden] = usePersistedState('emily.garden', [])
  const [confirming, setConfirming] = useState(false)
  const [spiritsOpen, setSpiritsOpen] = useState(false)

  const spiritsButton = (
    <button
      onClick={() => setSpiritsOpen(true)}
      className="rounded-2xl bg-brown/10 px-4 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
    >
      🌲 Forest Spirits
    </button>
  )

  // Generate each tree's sprite once per garden change — not on every re-render
  // (e.g. toggling the clear-confirm), since generate() is deterministic by DNA.
  const sprites = useMemo(
    () => garden.map((tree) => ({ ts: tree.ts, ...generate(tree.id, 'mature') })),
    [garden],
  )

  return (
    <WindowFrame title="My Garden" className={className}>
      {garden.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-8 text-center">
          <p className="font-display text-lg text-brown">Your garden is empty for now.</p>
          <p className="mt-1 max-w-xs text-sm text-brown/60">
            Finish a focus session and a tree shows up here. One per session.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {onOpenAlmanac && (
              <button
                onClick={onOpenAlmanac}
                className="rounded-2xl bg-brown/10 px-4 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                🌿 Open the Grove Almanac
              </button>
            )}
            {spiritsButton}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="grid grid-cols-5 gap-2 min-[480px]:grid-cols-6 lg:grid-cols-5">
            {sprites.map((tree) => (
              <div
                key={tree.ts}
                className="flex items-end justify-center"
                title={new Date(tree.ts).toLocaleDateString()}
              >
                <PixelSprite grid={tree.grid} palette={tree.palette} pixel={4} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onOpenAlmanac && (
              <button
                onClick={onOpenAlmanac}
                className="rounded-2xl bg-brown/10 px-3 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                🌿 Grove Almanac
              </button>
            )}
            <button
              onClick={() => setSpiritsOpen(true)}
              className={`rounded-2xl bg-brown/10 px-3 py-2 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow ${
                onOpenAlmanac ? '' : 'col-span-2'
              }`}
            >
              🌲 Forest Spirits
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-brown/60">
              {garden.length} {garden.length === 1 ? 'tree' : 'trees'} so far
            </p>
            {confirming ? (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="text-brown/60">Clear all?</span>
                <button
                  onClick={() => {
                    setGarden([])
                    setConfirming(false)
                  }}
                  className="rounded-lg bg-brown/10 px-2 py-1 font-display text-brown transition-colors hover:bg-brown/20 focus-visible:ring-2 focus-visible:ring-ever-yellow"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-lg px-2 py-1 text-brown/60 underline-offset-2 hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
                >
                  Keep
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="rounded-lg px-2 py-1 text-xs text-brown/50 underline-offset-2 hover:text-brown hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                Clear garden
              </button>
            )}
          </div>
        </div>
      )}

      {spiritsOpen && (
        <Suspense fallback={null}>
          <ForestSpiritsModal onClose={() => setSpiritsOpen(false)} />
        </Suspense>
      )}
    </WindowFrame>
  )
}
