import useUiPrefs from '../hooks/useUiPrefs.js'

/**
 * Appearance settings for the cozy 16-bit theme. Device-local (emily.ui), visual
 * only. Effects intensity scales the flavour (typewriter, transitions, ornaments,
 * sounds); reduced motion and deep focus always quiet it regardless. UI sounds stay
 * silent until ambient audio is started and default low, and are never the only
 * feedback. Honest, modest copy.
 */
const EFFECTS = [
  { id: 'full', label: 'Full' },
  { id: 'calm', label: 'Calm' },
  { id: 'minimal', label: 'Minimal' },
]

export default function AppearanceSettings() {
  const { effects, typewriter, sounds, reduced, setUi } = useUiPrefs()
  const soundPct = Math.round((sounds / 0.6) * 100)

  return (
    <section
      aria-label="Appearance"
      className="space-y-3 rounded-xl border-2 border-brown/15 bg-white/50 p-3.5"
    >
      <h3 className="font-display text-base text-brown">Appearance</h3>

      <label className="flex items-center justify-between gap-3 text-sm">
        <span>
          Effects intensity
          <span className="block text-xs text-brown/60">How lively the game-style flourishes are.</span>
        </span>
        <select
          value={effects}
          onChange={(e) => setUi({ effects: e.target.value })}
          className="rounded-lg border-2 border-brown/20 bg-cream px-2.5 py-1.5 font-display text-sm text-brown focus-visible:ring-2 focus-visible:ring-ever-yellow"
        >
          {EFFECTS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {reduced && (
        <p className="text-xs text-brown/55">
          Your device asks for reduced motion, so effects already stay still and instant.
        </p>
      )}

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={typewriter}
          onChange={(e) => setUi({ typewriter: e.target.checked })}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-sunset-magenta"
        />
        <span>
          Dialogue typewriter
          <span className="block text-xs text-brown/60">
            Reveal companion lines letter by letter. A tap or key always shows it all at once.
          </span>
        </span>
      </label>

      <label className="block text-sm">
        <span className="flex items-center justify-between">
          <span>Menu sounds</span>
          <span className="text-xs tabular-nums text-brown/60">{sounds <= 0 ? 'off' : `${soundPct}%`}</span>
        </span>
        <input
          type="range"
          min="0"
          max="0.6"
          step="0.05"
          value={sounds}
          onChange={(e) => setUi({ sounds: Number(e.target.value) })}
          aria-label="Menu sound volume"
          aria-valuetext={sounds <= 0 ? 'off' : `${soundPct} percent`}
          className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-brown/20 accent-sunset-magenta"
        />
        <span className="mt-0.5 block text-xs text-brown/60">
          Soft blips for menu moves and confirms. Silent until you start the ambient audio.
        </span>
      </label>
    </section>
  )
}
