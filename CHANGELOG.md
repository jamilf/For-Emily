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
