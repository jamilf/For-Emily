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
  barClass = 'bg-bg1',
  className = '',
}) {
  return (
    <section
      aria-label={title}
      className={`group overflow-hidden rounded-2xl border-2 border-bgDim/80 shadow-window transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Title bar */}
      <div className={`flex items-center gap-2 border-b-2 border-bgDim/40 px-3 py-2 ${barClass}`}>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-ever-red shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-ever-yellow shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-ever-green shadow-sm" />
        </span>
        <span className="ml-1 font-display text-base font-medium tracking-wide text-fg">
          {title}
        </span>
      </div>

      {/* Window body */}
      <div className={`p-5 text-brownDark sm:p-6 ${bodyClass}`}>{children}</div>
    </section>
  )
}
