import Drawer from './Drawer.jsx'
import { useMixer } from '../audio/AudioMixerProvider.jsx'

/** A labeled volume slider that reports a friendly percentage to screen readers. */
function VolumeSlider({ id, label, icon, value, onChange }) {
  const pct = Math.round(value * 100)
  return (
    <label className="flex items-center gap-3 py-1.5">
      <span className="w-6 text-center" aria-hidden="true">
        {icon}
      </span>
      <span className="w-28 shrink-0 text-sm">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(id, Number(e.target.value))}
        aria-label={`${label} volume`}
        aria-valuetext={`${pct} percent`}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-brown/20 accent-sunset-magenta"
      />
    </label>
  )
}

/**
 * Feature 1 — Ambient Audio Mixer. Sliders + buttons are generated from the
 * synthesized-layer config; everything persists via the mixer context.
 */
export default function AmbientMixerDrawer({ onClose }) {
  const { layers, enabled, master, levels, start, stop, setLevel, setMaster, muteAll } = useMixer()

  const btn =
    'flex-1 rounded-xl px-3 py-2 font-display text-sm transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-ever-yellow'

  return (
    <Drawer open onClose={onClose} title="🎚️ Ambient Mixer" className="zen-hide">
      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={enabled}
          className={`${btn} bg-ever-green text-bg0 hover:brightness-95 disabled:opacity-40`}
        >
          ▶ Start
        </button>
        <button
          onClick={stop}
          disabled={!enabled}
          className={`${btn} bg-brown/15 text-brown hover:bg-brown/25 disabled:opacity-40`}
        >
          ◼ Stop
        </button>
        <button onClick={muteAll} className={`${btn} bg-brown/15 text-brown hover:bg-brown/25`}>
          🔇 Mute all
        </button>
      </div>

      <p className="mt-2 text-xs text-brown/60" aria-live="polite">
        {enabled ? 'Playing' : 'Tap Start. Nothing plays on its own.'}
      </p>

      <div className="mt-3 border-t border-brown/15 pt-3">
        <VolumeSlider
          id="__master"
          label="Master"
          icon="🔊"
          value={master}
          onChange={(_, v) => setMaster(v)}
        />
      </div>

      <div className="mt-2 border-t border-brown/15 pt-2">
        {layers.map((l) => (
          <VolumeSlider
            key={l.id}
            id={l.id}
            label={l.label}
            icon={l.icon}
            value={levels[l.id] ?? 0}
            onChange={setLevel}
          />
        ))}
      </div>
    </Drawer>
  )
}
