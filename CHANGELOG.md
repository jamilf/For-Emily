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
