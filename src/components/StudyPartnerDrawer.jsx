import { useState } from 'react'
import Drawer from './Drawer.jsx'
import usePersistedState from '../hooks/useLocalStorage.js'

// "Study with me" companion videos (muted, looping, autoplay).
const VIDEO_IDS = ['4ROO1-m3dG0', 'kqcPqF_2Euw', 'FjHgZqA7Kpw', 'w2KbbzJ1R3o']

/**
 * Feature 5 — Virtual Study Partner. A collapsible YouTube companion. Stays
 * mounted while collapsed (so it keeps playing); Swap cycles partners and
 * persists the choice. Autoplay is muted to satisfy browser policies.
 */
export default function StudyPartnerDrawer({ open, onClose }) {
  const [index, setIndex] = usePersistedState('emily.partner', 0)
  const [failed, setFailed] = useState(false)
  const id = VIDEO_IDS[index % VIDEO_IDS.length]
  const src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&modestbranding=1&rel=0`

  function swap() {
    setFailed(false)
    setIndex((i) => (i + 1) % VIDEO_IDS.length)
  }

  return (
    <Drawer open={open} onClose={onClose} title="🎬 Study Partner" className="zen-hide">
      <div className="overflow-hidden rounded-xl border-2 border-brown/20 bg-black/80">
        {failed ? (
          <div className="p-4 text-center text-sm text-cream">
            <p>This partner couldn’t load.</p>
            <a
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block underline"
            >
              Open on YouTube ↗
            </a>
          </div>
        ) : (
          <div className="aspect-video">
            <iframe
              key={id}
              title="Study partner video"
              src={src}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              onError={() => setFailed(true)}
              className="h-full w-full"
            />
          </div>
        )}
      </div>
      <button
        onClick={swap}
        className="mt-3 w-full rounded-xl bg-brown px-4 py-2 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow"
      >
        ⇄ Swap partner
      </button>
    </Drawer>
  )
}
