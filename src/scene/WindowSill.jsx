// A cozy wooden window frame in the very foreground, so the whole scene reads as a
// view out a window from Emily's desk. Decorative only: aria-hidden, never
// interactive (pointer-events-none), and sits at z-[3] — above the weather, below
// the UI — so it frames the margins and the bottom of the view and can never cover
// or block content. The frame is deliberately static (a real window frame hugs the
// screen edges); the sense of depth comes from the SkyScene bands parallaxing
// behind it. The glass sheen warms at dusk/night via the .window-glass tod rules.

const WOOD = 'linear-gradient(to bottom, #9A663C 0%, #7C4F2D 45%, #5C3A24 100%)'

export default function WindowSill() {
  return (
    <div
      aria-hidden="true"
      data-testid="windowsill"
      className="window-frame pointer-events-none fixed inset-0 z-[3]"
    >
      {/* A faint sheen on the glass; tinted warm at dusk/night via index.css */}
      <div className="window-glass absolute inset-0" />

      {/* Slim wooden jambs hugging the edges (hidden on the narrowest screens so
          mobile stays clear). */}
      <div
        className="absolute inset-y-0 left-0 hidden w-2.5 sm:block"
        style={{ background: 'linear-gradient(to right, #5C3A24, rgba(92,58,36,0))' }}
      />
      <div
        className="absolute inset-y-0 right-0 hidden w-2.5 sm:block"
        style={{ background: 'linear-gradient(to left, #5C3A24, rgba(92,58,36,0))' }}
      />
      <div
        className="absolute inset-x-0 top-0 hidden h-2 sm:block"
        style={{ background: 'linear-gradient(to bottom, rgba(60,38,24,0.65), rgba(60,38,24,0))' }}
      />

      {/* The windowsill ledge across the bottom, with a couple of cozy props. */}
      <div className="absolute inset-x-0 bottom-0">
        {/* a little potted plant, resting on the sill */}
        <svg
          className="pixelated absolute bottom-7 left-3 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] sm:bottom-9 sm:left-6"
          width="44"
          height="48"
          viewBox="0 0 22 24"
          shapeRendering="crispEdges"
        >
          {/* foliage */}
          <g fill="#5E8C5A">
            <rect x="8" y="2" width="6" height="6" />
            <rect x="4" y="6" width="6" height="6" />
            <rect x="12" y="6" width="6" height="6" />
            <rect x="7" y="10" width="8" height="5" />
          </g>
          <g fill="#7DB36F">
            <rect x="9" y="3" width="2" height="2" />
            <rect x="5" y="7" width="2" height="2" />
            <rect x="14" y="7" width="2" height="2" />
          </g>
          {/* a small blossom */}
          <rect x="11" y="5" width="2" height="2" fill="#F4A6C0" />
          {/* terracotta pot */}
          <g fill="#B5663C">
            <rect x="6" y="15" width="10" height="2" />
            <rect x="7" y="17" width="8" height="6" />
          </g>
          <rect x="7" y="17" width="8" height="1" fill="#C9784B" />
        </svg>

        {/* a steaming mug on the other side */}
        <svg
          className="pixelated absolute bottom-7 right-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)] sm:bottom-9 sm:right-9"
          width="40"
          height="44"
          viewBox="0 0 20 22"
          shapeRendering="crispEdges"
        >
          {/* steam (gentle; stilled under reduced motion) */}
          <g className="animate-float" fill="rgba(255,255,255,0.45)">
            <rect x="7" y="2" width="1" height="3" />
            <rect x="11" y="1" width="1" height="3" />
          </g>
          {/* mug body */}
          <rect x="4" y="8" width="11" height="10" fill="#E7D8B8" />
          <rect x="4" y="8" width="11" height="2" fill="#F4E9CE" />
          {/* handle */}
          <rect x="15" y="10" width="3" height="2" fill="#E7D8B8" />
          <rect x="16" y="12" width="2" height="3" fill="#E7D8B8" />
          <rect x="15" y="15" width="3" height="2" fill="#E7D8B8" />
          {/* the brew */}
          <rect x="5" y="9" width="9" height="2" fill="#7C4F2D" />
        </svg>

        {/* the wooden plank */}
        <div className="relative h-7 sm:h-9" style={{ background: WOOD }}>
          <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'rgba(214,160,110,0.55)' }} />
        </div>
      </div>
    </div>
  )
}
