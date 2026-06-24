/**
 * StatusPanel + StatGauge — the JRPG "character sheet" framing for positive stats.
 *
 * Gauges FILL toward a goal and never deplete or imply loss: there is no "damage"
 * state, no red emptying bar, only progress. The numeric value is always rendered
 * as text and exposed via role="meter" (aria-valuenow/min/max), so state is never
 * conveyed by colour alone and screen readers read the exact figure.
 */

const TONES = {
  green: 'bg-ever-green',
  gold: 'bg-ever-yellow',
  aqua: 'bg-ever-aqua',
  rose: 'bg-sunset-rose',
}

export function StatGauge({ label, value = 0, max = 1, icon, tone = 'green', valueText, className = '' }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  const text = valueText ?? `${value} / ${max}`
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1 flex items-center justify-between font-display text-xs text-brown">
        <span className="flex items-center gap-1.5">
          {icon && <span aria-hidden="true">{icon}</span>}
          {label}
        </span>
        <span className="tabular-nums text-brown/70">{text}</span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${text}`}
        className="pixel-bevel h-3.5 w-full overflow-hidden rounded-sm bg-brown/15"
      >
        <div
          className={`h-full rounded-sm transition-[width] duration-500 ${TONES[tone] || TONES.green}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function StatusPanel({ title, children, className = '' }) {
  return (
    <section aria-label={title} className={`flex flex-col gap-3 ${className}`}>
      {title && <p className="font-display text-xs uppercase tracking-wide text-brown/55">{title}</p>}
      {children}
    </section>
  )
}
