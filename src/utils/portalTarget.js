// Where modal overlays should be portaled. A modal's `position: fixed` overlay
// anchors to the nearest *transformed* ancestor rather than the viewport, so a
// modal rendered deep in the dashboard (e.g. inside the timer column, which carries
// a slide-in transform) would be misplaced. Portaling out of that subtree fixes it.
//
// We portal into `.app-root` rather than `document.body` on purpose: `.app-root`
// has no transform (so `fixed` still anchors to the viewport), and it carries the
// `data-fx` attribute + focus/zen classes that drive `--fx-scale`, so effect
// intensity keeps cascading into the modal. `document.body` (a sibling of
// `.app-root`) would drop that inheritance. Falls back to `document.body` for
// standalone renders (e.g. isolated component tests) where no app root exists.
export function portalTarget() {
  if (typeof document === 'undefined') return null
  return document.querySelector('.app-root') || document.body
}
