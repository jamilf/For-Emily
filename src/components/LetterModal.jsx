import { useEffect, useRef, useState } from 'react'
import usePersistedState from '../hooks/useLocalStorage.js'
import useEscapeKey from '../hooks/useEscapeKey.js'
import {
  pickByContext,
  verseOfDay,
  randomSignoff,
  ALL_REFS,
} from '../data/encouragements.js'
import { fetchVerses, ATTRIBUTION } from '../data/scripture.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The soot sprite's letter. A context-aware note addressed to Emily, drawn from
 * the shared encouragement library with a no-repeat shuffle bag. Scripture text
 * is pulled from the cached verses map (fetched lazily, cached to emily.verses);
 * if a verse is not cached the picker quietly falls back to an original.
 *
 * @param {string} context  daily | morning | night | complete | rough | breeze | break | idle
 * @param {() => void} onClose
 */
export default function LetterModal({ context = 'idle', onClose }) {
  const [verses, setVerses] = usePersistedState('emily.verses', {})
  const [spr, setSpr] = usePersistedState('emily.spr', { seen: [], lastOpenDay: '' })
  const [keepsakes, setKeepsakes] = usePersistedState('emily.keepsakes', [])

  const [msg, setMsg] = useState(null) // { id, type, ref, text, tone }
  const [loading, setLoading] = useState(true)
  const [showKept, setShowKept] = useState(false)
  const [signoff] = useState(() => randomSignoff())
  const closeRef = useRef(null)

  useEscapeKey(onClose)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Compose the letter once on mount, then warm the verse cache in the
  // background so future letters can include scripture too.
  useEffect(() => {
    let cancelled = false
    const day = today()
    ;(async () => {
      let v = verses

      // On the daily letter, try to ensure the verse-of-the-day is available so
      // it can headline. Capped to a single request; offline just falls back.
      if (context === 'daily') {
        const vod = verseOfDay(v, day)
        if (vod && !v[vod.ref]) {
          try {
            v = await fetchVerses([vod.ref], v, 1)
          } catch {
            /* offline — fall back below */
          }
        }
      }
      if (cancelled) return

      let chosen = null
      let nextSeen = spr.seen
      if (context === 'daily') {
        const vod = verseOfDay(v, day)
        if (vod && vod.text) chosen = { id: vod.id, type: 'scripture', ref: vod.ref, text: vod.text, tone: 'scripture' }
      }
      if (!chosen) {
        const r = pickByContext(context, { seen: spr.seen, verses: v })
        chosen = { id: r.item.id, type: r.item.type, ref: r.item.ref || null, text: r.text, tone: r.item.tone }
        nextSeen = r.nextSeen
      }

      setMsg(chosen)
      setSpr({ seen: nextSeen, lastOpenDay: day })
      if (v !== verses) setVerses(v)
      setLoading(false)

      // Gentle background warm-up of the rest of the verse cache.
      try {
        const nv = await fetchVerses(ALL_REFS, v, 12)
        if (!cancelled && nv !== v) setVerses(nv)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isKept = msg && keepsakes.some((k) => k.id === msg.id && k.text === msg.text)

  function toggleKeep() {
    if (!msg) return
    setKeepsakes((prev) =>
      isKept
        ? prev.filter((k) => !(k.id === msg.id && k.text === msg.text))
        : [...prev, { id: msg.id, text: msg.text, ref: msg.ref, type: msg.type, signoff, ts: Date.now() }],
    )
  }

  function openKept(k) {
    setMsg({ id: k.id, type: k.type, ref: k.ref || null, text: k.text, tone: k.type === 'scripture' ? 'scripture' : 'original' })
    setShowKept(false)
  }

  const isScripture = msg?.type === 'scripture'

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
      onTouchEnd={onClose}
    >
      <div className="absolute inset-0 bg-bgDim/75 sm:backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="A letter for you"
        className="animate-modal-in relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Window title bar — warm wood tone */}
        <div
          className="flex items-center justify-between gap-2 border-b-2 border-brownDark/50 px-3 py-2"
          style={{ background: 'linear-gradient(to bottom, #9A663C, #8F5E36 55%, #7C4F2D)' }}
        >
          <span className="ml-1 font-display text-base text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            ✉ {showKept ? 'Letters you’ve kept' : 'A letter for you'}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close letter"
            className="rounded-full px-2 text-cream/90 transition-colors hover:text-cream active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="paper-grain overflow-y-auto bg-cream p-7 text-brownDark">
          {showKept ? (
            // ── Keepsakes list ────────────────────────────────────────────
            keepsakes.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-brown/70">
                  No kept letters yet. Tap the heart on a letter to save it here for a harder day.
                </p>
                <button
                  onClick={() => setShowKept(false)}
                  className="mt-5 rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Back
                </button>
              </div>
            ) : (
              <div>
                <ul className="space-y-2">
                  {[...keepsakes].reverse().map((k) => (
                    <li key={`${k.id}-${k.ts}`}>
                      <button
                        onClick={() => openKept(k)}
                        className="w-full rounded-xl border-2 border-brown/15 bg-white/60 px-3 py-2.5 text-left text-sm leading-relaxed transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ever-yellow"
                      >
                        <span className={isScriptureText(k) ? 'italic' : ''}>{k.text}</span>
                        {k.ref && <span className="mt-1 block font-display text-xs text-brown/50">— {k.ref}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowKept(false)}
                  className="mt-5 w-full rounded-2xl bg-brown/10 px-4 py-2.5 font-display text-brown transition-colors hover:bg-brown/20 active:scale-95"
                >
                  Back to your letter
                </button>
              </div>
            )
          ) : (
            // ── The letter ────────────────────────────────────────────────
            <>
              <p className="font-display text-lg text-brown">Dear Emily,</p>

              {loading ? (
                <p className="mt-3 text-sm text-brown/50">a little note is on its way…</p>
              ) : (
                <>
                  <p className={`mt-3 text-base leading-relaxed sm:text-lg ${isScripture ? 'italic' : ''}`}>
                    {msg?.text}
                  </p>
                  {isScripture && msg?.ref && (
                    <p className="mt-2 font-display text-sm text-brown/70">— {msg.ref}</p>
                  )}
                  <p className="mt-5 text-right font-display text-sm text-brown/70">{signoff}</p>
                  {isScripture && ATTRIBUTION && (
                    <p className="mt-3 text-[0.7rem] text-brown/40">{ATTRIBUTION}</p>
                  )}
                </>
              )}

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={toggleKeep}
                  disabled={loading}
                  aria-pressed={isKept}
                  aria-label={isKept ? 'Remove from kept letters' : 'Keep this letter'}
                  className="flex h-11 items-center gap-1.5 rounded-2xl bg-brown/10 px-4 font-display text-sm text-brown transition-colors hover:bg-brown/20 active:scale-95 disabled:opacity-50"
                >
                  <span aria-hidden="true">{isKept ? '❤️' : '🤍'}</span>
                  {isKept ? 'Kept' : 'Keep'}
                </button>
                <button
                  onClick={() => setShowKept(true)}
                  className="flex h-11 items-center rounded-2xl px-3 font-display text-sm text-brown/70 underline-offset-2 transition-colors hover:text-brown hover:underline"
                >
                  Letters I’ve kept{keepsakes.length > 0 ? ` (${keepsakes.length})` : ''}
                </button>
                <button
                  onClick={onClose}
                  className="ml-auto flex h-11 items-center rounded-2xl bg-brown px-5 font-display text-sm text-cream transition-colors hover:bg-brownDark active:scale-95"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// A kept letter is scripture if it carries a reference.
function isScriptureText(k) {
  return k.type === 'scripture' || !!k.ref
}
