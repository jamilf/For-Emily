# Changelog

Work to optimise, harden, and test Emily's Study Sanctuary. One line per changed
file, grouped by the phase that introduced it.

## Phase 1 — testing foundation & a11y focus traps

- `AUDIT.md` — new: full audit (component map, all `emily.*` keys, findings by severity).
- `TESTING.md` — new: how to run every quality gate; manual a11y pass.
- `eslint.config.js` — new: ESLint 9 flat config (react, hooks, jsx-a11y, prettier).
- `.prettierrc` — new: shared formatting rules; applied repo-wide (formatting only).
- `vitest.config.js` — new: jsdom + globals + setup + v8 coverage thresholds.
- `src/test/setup.js` — new: jest-dom + axe matchers, localStorage/canvas/matchMedia stubs.
- `src/hooks/useFocusTrap.js` — new: Tab-cycle + Esc + return-focus trap for overlays.
- `src/components/{GuideModal,SyncModal,LetterModal,ReflectionModal,Flashcards}.jsx` — focus trap + accessible backdrop button (was a non-interactive div with handlers).
- `src/components/Dock.jsx` — `<nav role="toolbar">` → `<div role="toolbar">` (a11y).
- `src/audio/AudioMixerProvider.jsx` — snapshot refs in unmount cleanup (hooks lint).
- `src/components/PomodoroTimer.jsx` — drop unused `reflections`/`garden` reads.
- `src/{data,storage,components}/*.test.{js,jsx}` — new: 43 unit/component/a11y tests.
- `package.json` — test/lint/format/coverage/e2e scripts + dev dependencies.

## Phase 2 — optimise & harden

- `src/utils/timer.js` — new: pure timer math (`endsAtFrom`, `remainingSeconds`, `formatClock`).
- `src/components/PomodoroTimer.jsx` — timestamp-based countdown (no tab-backgrounding drift).
- `src/components/ErrorBoundary.jsx` — new: in-theme fallback; wraps the app in `App.jsx`.
- `src/storage/StorageManager.js` — `exportAll`/`importAll`/`validateBackup` + real idempotent `migrate()`.
- `src/components/BackupControls.jsx` — new: "Sanctuary backup" download/restore UI (in GuideModal).
- `src/scene/SkyScene.jsx` — wrapped in `React.memo` (skips re-render on dashboard ticks).
- `src/data/scripture.js` — single config switch: WEB default + optional licensed NIV via API.Bible key.
- `.env.example` — new: documents DEPLOY_BASE, Supabase, and scripture env vars.
- Tests added: timer math, ErrorBoundary, BackupControls restore, scripture fetch (mocked) — 70 total.

## Phase 3 — flashcards (TDD)

- `src/data/scheduler.js` — new: timezone-correct local day boundaries (`isDueToday`,
  `dueToday`), `buildQueue` with a new-cards-per-session cap, `studyAhead`,
  `dedupeCards`, `isLeech`/`leeches`, and a `forecast` of upcoming reviews. All pure + tested.
- `src/data/flashcards.js` — `parseBulk` now also accepts tab and comma (CSV); splits on the
  first separator so answers may contain commas/colons.
- `src/components/Flashcards.jsx` — session **resume** (persists to `emily.flashSession`,
  resume banner on reopen); **undo last rating** (misclick recovery, `U` key + buttons);
  **edit/delete the current card mid-review**; gentle **leech** reword nudge; new-card cap via
  `buildQueue`; import now **de-duplicates** and reports counts; "due today" uses local day.
- `src/storage/StorageManager.js` — registered `emily.flashSession` default (device-local).
- Tests added: scheduler (16), CSV parse, Flashcards integration (rate→reschedule→resume,
  undo, dedupe import) — 92 total, ~95% coverage on core modules.

## Phase 4 — E2E, Lighthouse & CI

- `playwright.config.js` — new: desktop + mobile (Pixel 5) projects; builds and serves the
  SPA via `vite preview`.
- `e2e/sanctuary.spec.js` — new: (1) focus session fast-forwarded with Playwright's clock API
  → sprite letter; (2) flashcard import → review → reload persistence; (3) backup export →
  clear → re-import restore; (4) mobile smoke. Each asserts no console errors.
- `lighthouserc.json` — new: Performance / Accessibility / Best-Practices ≥ 0.90 against `dist/`.
- `.github/workflows/ci.yml` — new: `check` (lint + format:check + coverage + build), `e2e`
  (Playwright Chromium), and `lighthouse` jobs on push/PR.

_Note: Playwright + Lighthouse run in CI; the dev sandbox has no browser binaries (download
CDN network-blocked). All jsdom gates, lint, format, coverage, and build are verified green locally._

## Phase 5 — flashcard deck management, search, swipe & forecast

- `src/components/Flashcards.jsx` — new **Manage** view: search/filter cards (front/back/deck,
  capped at 100 rows so 1000+ cards never jank), **move a card to another deck**, **delete a card**,
  and **rename / delete a deck**. Added **swipe gestures** on the flip card (swipe to reveal; when
  flipped, right = Good, left = Again) with a mobile hint. The Progress view now shows a calm
  **7-day upcoming-reviews forecast** (`forecast()` from scheduler.js).
- Tests: search filter, move-deck, delete-card, and forecast render added to `Flashcards.test.jsx`.
- Deck **reorder** is intentionally omitted — decks auto-sort by due-count then name, which keeps
  the most relevant deck on top without manual fiddling.

## Cleanup pass — dedupe & dead code

- Removed dead exports from `src/data/flashcards.js`: `nextDue`, `SPACING_DAYS`, and
  `sessionQueue` (superseded by `scheduler.buildQueue`) — which also dropped its now-unused local
  `shuffle`. Flashcards-chunk logic coverage rose to ~99%.
- New `src/utils/day.js` (`dayStr`/`yesterdayStr`, UTC) replaces the duplicated copies in
  `flashcards.js` + `PomodoroTimer.jsx` and the inline `toISOString().slice(0,10)` in
  `LetterModal`, `FocusMeter`, `BackupControls`, and `encouragements.verseOfDay`. A clarifying note
  distinguishes these UTC stat helpers from scheduler's deliberately LOCAL day boundaries.
- Pruned the redundant `sessionQueue` tests; added `src/utils/day.test.js`. 97 tests, ~97% coverage.

## Phase 10 — Grove Almanac (tree collection / unlocks)

- `src/data/grove.js` — new: a finite catalogue of ~20 named tree varietals as fixed presets of
  the existing deterministic generator (`dna = shape + trunk*4 + pattern*12 + palette*36`), plus a
  pure unlock model derived ENTIRELY from existing stores (garden length/timestamps, stats.streak,
  flashcardStats.total, reflections.length). Sticky, retroactive, never punitive. Fully unit-tested.
- `src/components/ProceduralTree.jsx` — new: the single shared renderer (generator + PixelSprite),
  memoised; `state="locked"` recolours the same geometry to one faded silhouette tone.
- `src/components/GroveAlmanac.jsx` — new: lazy modal (focus-trap + backdrop + Esc) — progress
  header, "next bloom" goal, All/Grown/Locked filter, responsive card grid (full render vs locked
  silhouette + lock + hint + progress, triple-encoded), detail sheet, "grow this one next", and a
  reduced-motion-friendly unlock celebration.
- `src/components/FocusGarden.jsx` — adds the "Open the Grove Almanac" entry point.
- `src/components/PomodoroTimer.jsx` — a session consumes a queued `grove.plantNext` seed if set
  (else random); no other behavior change.
- `src/storage/StorageManager.js` — `emily.grove` default + schema **v3** migration that seeds the
  collection retroactively from existing stats (no data loss). `src/sync/syncEngine.js` — `emily.grove`
  added to `SYNC_KEYS` so unlocks follow Emily across devices.
- Tests: grove unit suite (18) + Almanac component/axe suite (6) + v2→v3 migration test +
  `e2e/grove.spec.js` (CI screenshots, desktop + mobile). 121 tests; ~97% coverage on core modules.

## Phase 11 — Firefly Calendar (focus-consistency map)

- `src/data/focusLog.js` — new: the pure, deterministic time-series behind the dusk-meadow
  consistency map. Buckets completed focus sessions by **LOCAL** day (reusing the scheduler's
  `localDayStr`, never UTC). Exports `localYMD`, `backfillFromGarden` (reconstruct history from
  `emily.garden` timestamps, `minutes: null`), `recordSession` (immutable; null→real minutes merge),
  `lastNWeeks` (7-lane × N-week grid, future cells inert), `activeWithin`, `summarize` (reuses the
  passed-in streak — never recomputed), and `bucketFor` (0–4+). Fully unit-tested incl. local-midnight
  edge cases.
- `src/components/FireflyCalendar.jsx` — new: lazy, focus-trapped modal (same shell as every dialog).
  A dusk meadow where each completed focus session lights one firefly on its day. Intensity is conveyed
  three ways — firefly count, a numeric badge, and the accessible label — **never colour alone**. Empty
  days stay calm (never red/failure); future days are inert. Accessible grid: roving tabindex with
  arrow/Home/End navigation, Enter/Space selects a day into an `aria-live` detail region. Header summary
  (sessions, known focus time, active days, **reused** streak, brightest day) + 1–3 gentle, original,
  non-shaming insights (incl. a "welcome back" line after a gap — never "you lost your streak"). Honors
  `prefers-reduced-motion` (static fireflies). All copy original; no scripture/encouragement-library text.
- `src/components/FocusMeter.jsx` — adds the pixel-font "✨ Firefly Calendar" entry point (lazy + Suspense).
- `src/components/PomodoroTimer.jsx` — at focus-session completion, also logs to `emily.focusLog` via
  `recordSession` with the real focus length (`FOCUS_MINUTES`) and the same `ts` used for the garden tree.
  Breaks never log. No existing timer behavior changed.
- `src/storage/StorageManager.js` — `emily.focusLog` default + schema **v3 → v4** migration that
  backfills the calendar retroactively from `emily.garden` (idempotent, non-destructive: never overwrites
  a live day, mutates no other key). `src/sync/syncEngine.js` — `emily.focusLog` added to `SYNC_KEYS`
  (per-key LWW). Sanctuary backup covers it automatically (all `emily.*` keys).
- `vitest.config.js` — `src/data/focusLog.js` added to the coverage `include` set.
- Tests: focusLog unit suite (18) + FireflyCalendar component/axe suite (7) + v3→v4 migration & backup
  tests + `SYNC_KEYS` assertion + `e2e/firefly.spec.js` (CI screenshots + mobile scroll, desktop + mobile).
  149 tests; ~96% coverage on core modules.

### Future idea (not built)

- Naming notable "constellations" of fireflies on milestones — deliberately deferred; it overlaps the
  Grove Almanac's unlock/naming model and risks scope creep.
