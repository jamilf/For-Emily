// sceneState — the pure layer behind the Grove Window diorama. Everything the
// scene shows derives from state the app already keeps: the story hook's part of
// day, the ambient mixer's weather sliders, and the running session. No I/O, no
// clock reads, nothing persisted: same inputs, same scene, always.

// Sky ramps per part of day. Every hex is an existing app token (Everforest /
// sunset palette from tailwind.config), named once here so the scene never grows
// ad-hoc colours.
export const SKY_RAMPS = {
  dawn: { top: '#5A4A78', mid: '#E0719C', horizon: '#FFD27D' }, // violet -> rose -> gold
  day: { top: '#7FBBB3', mid: '#83C092', horizon: '#FDF6E3' }, // soft blue -> aqua -> cream
  dusk: { top: '#352A52', mid: '#9B3D73', horizon: '#F9A857' }, // indigo -> magenta -> ember
  night: { top: '#232A2E', mid: '#352A52', horizon: '#5A4A78' }, // near-black -> indigo -> far violet
}

// How much ambient light each part of day carries (drives ground shading and how
// strongly the sky tints the scene).
const AMBIENT = { dawn: 0.72, day: 1, dusk: 0.6, night: 0.38 }

const GROUND_BASE = '#6f8c4f' // the app's forest-green foliage token

const clamp01 = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0)

// Darken a hex toward night (pure integer math; no new authored hexes).
function dim(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * f)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Derive the Grove Window's scene from existing state.
 * @param {object} ctx
 * @param {'dawn'|'day'|'dusk'|'night'} [ctx.partOfDay]  from useStory()
 * @param {{levels?:{steadyRain?:number,thunder?:number}}} [ctx.mixer]  emily.mixer
 * @param {boolean} [ctx.sessionActive]
 * @param {number} [ctx.sessionFraction]  0..1 progress of the running session
 * @returns {{ daypart:string, skyRamp:{top:string,mid:string,horizon:string},
 *   ambientLight:number, ground:string, weather:{rain:number,thunder:number},
 *   warmth:number }}
 */
export function deriveScene({ partOfDay, mixer, sessionActive = false, sessionFraction = 0 } = {}) {
  const daypart = SKY_RAMPS[partOfDay] ? partOfDay : 'day'
  const ambientLight = AMBIENT[daypart]
  return {
    daypart,
    skyRamp: SKY_RAMPS[daypart],
    ambientLight,
    // The horizon band's grass, dimmed with the failing light.
    ground: dim(GROUND_BASE, 0.5 + 0.5 * ambientLight),
    weather: {
      rain: clamp01(mixer?.levels?.steadyRain),
      thunder: clamp01(mixer?.levels?.thunder),
    },
    // Session warmth (refined by sessionBloom in the next phase).
    warmth: sessionActive ? clamp01(sessionFraction) : 0,
  }
}
