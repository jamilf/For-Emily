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
      className={`group pixel-bevel flex flex-col overflow-hidden rounded-xl shadow-window transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* JRPG nameplate title bar — plum→indigo, with a pixel gem ornament. */}
      <div
        className={`flex items-center gap-2 border-b-2 border-jrpg-edge px-3 py-2 ${barClass}`}
        style={
          barClass ? undefined : { background: 'linear-gradient(to bottom, #5C3A6E, #4A2F5C 55%, #352A52)' }
        }
      >
        <span aria-hidden="true" className="h-2.5 w-2.5 rotate-45 bg-jrpg-cursor" />
        <span className="ml-0.5 font-display text-base font-medium tracking-wide text-cream drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
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
