/**
 * SceneTransition — a fast, skippable, NON-BLOCKING scene wipe for entering a mode
 * (e.g. starting a focus session). It is purely cosmetic: it never gates the state
 * change, never captures input (pointer-events: none), and collapses to an instant
 * (invisible) cut under reduced motion or Minimal effects via --fx-scale. The wipe
 * replays whenever `trigger` changes (remount by key); a falsy trigger renders
 * nothing, so the very first paint has no overlay.
 *
 * @param {{ trigger?: number }} props  bump `trigger` to play the wipe.
 */
export default function SceneTransition({ trigger = 0 }) {
  if (!trigger) return null
  return (
    <div key={trigger} aria-hidden="true" className="jrpg-wipe pointer-events-none fixed inset-0 z-[60]" />
  )
}
