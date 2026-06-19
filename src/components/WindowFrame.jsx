/**
 * The lofi "desktop window" chrome that wraps each widget.
 * A title bar with three soft traffic-light dots + a pixel-font title,
 * over a crisp window body.
 *
 * @param {string} title    Window title shown in the title bar.
 * @param {string} accent   Tailwind color class for the body tint (e.g. 'bg-cream').
 * @param {string} barTint  Tailwind color class for the title bar.
 * @param {ReactNode} children
 */
export default function WindowFrame({
  title,
  children,
  bodyClass = 'bg-cream',
  barClass = '',
  className = '',
}) {
  return (
    <section
      aria-label={title}
      className={`group flex flex-col overflow-hidden rounded-2xl border-2 border-brownDark/40 shadow-window transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Title bar — warm wood tone */}
      <div
        className={`flex items-center gap-2 border-b-2 border-brownDark/50 px-3 py-2 ${barClass}`}
        style={
          barClass ? undefined : { background: 'linear-gradient(to bottom, #9B3D73, #7C3F76 55%, #5C3A6E)' }
        }
      >
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-ever-red shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-ever-yellow shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-ever-green shadow-sm" />
        </span>
        <span className="ml-1 font-display text-base font-medium tracking-wide text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
          {title}
        </span>
      </div>

      {/* Window body — textured paper with a soft inner top highlight */}
      <div className={`paper-grain relative flex flex-1 flex-col p-5 text-brownDark sm:p-6 ${bodyClass}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/40 to-transparent"
        />
        <div className="relative flex-1">{children}</div>
      </div>
    </section>
  )
}
