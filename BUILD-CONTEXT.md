# Build Context — "Emily's Study Sanctuary" (source of truth for ideation)

> Paste this into a fresh chat as context before brainstorming features. It reflects the
> **actual current build**. Keep it updated as features land.

A cozy, ADHD-first study dashboard for Emily Tran (neuroscience student). Single-page
**Vite + React 18 + Tailwind** app, installable **PWA**, offline-first. Aesthetic: pixel-art
Studio Ghibli / Everforest, warm cream/brown palette, **pixel font (Pixelify Sans)** for
titles/labels, a soot-sprite companion. All art is **SVG/CSS/box-shadow pixel grids + emoji —
no image/asset files**. Deployed to **Cloudflare Workers** (foremilytran.com, static assets via
`wrangler.jsonc`) and **GitHub Pages** (`/For-Emily/`, base set by `DEPLOY_BASE`).

## Current features

- **Pomodoro timer** (`PomodoroTimer.jsx`): 25/5, **timestamp-based** (survives tab-backgrounding),
  session "one thing" intention, depleting SVG ring. Finishing a focus session grows a **procedural
  pixel-art tree** that's harvested into the garden; gentle tab-away "wither" pause.
- **Procedural trees** (`pixel/PlantGenerator.js` + `pixel/PixelSprite.jsx`): deterministic, seeded
  by a numeric `dna` (`dna = shape + trunk*4 + pattern*12 + palette*36`); 4 canopy shapes × 3 trunks
  × 3 patterns × 5 palettes = 180 variants; 4 growth stages (seed→sprout→sapling→mature). Rendered
  everywhere via the shared `ProceduralTree` component (`state="locked"` = faded monochrome silhouette).
- **My Garden** (`FocusGarden.jsx`): grid of harvested trees + entry to the Grove Almanac.
- **Grove Almanac** (`GroveAlmanac.jsx` + `data/grove.js`): collection of ~20 named tree varietals
  (fixed generator presets), locked/unlocked with hints + progress; unlocks derived from existing
  metrics (sessions grown, streak, flashcard reviews, reflections, before-noon/after-dark from tree
  timestamps), **sticky + retroactive**; "next bloom" goal, filter, detail sheet, "grow this one
  next" (queues the next session's species), reduced-motion celebration.
- **Focus Meter** (`FocusMeter.jsx`): daily-goal ring, study streak, session/minute/tree stats.
- **Flashcards** (`Flashcards.jsx` + `data/flashcards.js` + `data/scheduler.js`): Leitner SRS
  (Again/Hard/Good/Easy, keys 1–4), local-day-correct "due today" + new-card cap, **session resume**,
  **undo last rating**, edit/delete mid-review, deck management (create/rename/delete/move) + search,
  CSV/`term — definition` import with de-dupe, gentle **leech** reword nudge, 7-day forecast, swipe
  gestures, kind non-shaming stats.
- **Ambient Mixer** (`audio/AudioMixerProvider.jsx`): 7 synthesized Web-Audio layers (no files),
  focus-fade ducking; **WeatherCanvas** rain/thunder tracks the rain/thunder sliders.
- **Brain Dump** (`BrainDump.jsx`): floating auto-saving notepad.
- **Sprite Letters** (`LetterModal.jsx` + `data/encouragements.js` + `data/scripture.js`):
  context-aware "Dear Emily" notes from a 500+ original-encouragement library + verse-of-the-day;
  scripture is **fetched at runtime** (public-domain WEB by default; optional licensed NIV via
  `VITE_BIBLE_API_KEY`) and cached — never hardcoded; ❤️ keepsakes.
- **Reflection** check-in after focus; **Zen mode** hides side panels.
- **Cloud Sync** (`sync/`): Supabase **email 6-digit OTP** (no password), per-key last-write-wins,
  Row-Level-Security; logged-out = pure local. **Sanctuary backup** (`BackupControls.jsx`):
  export/import all `emily.*` as JSON.
- **Robustness**: top-level `ErrorBoundary`; every overlay uses a shared `useFocusTrap` (Tab cycle +
  Esc + return-focus) with an aria-hidden backdrop button; storage reads tolerate corrupt JSON.

## Architecture & conventions

- **State/persistence**: `hooks/useLocalStorage.js` (`usePersistedState`) persists under the `emily.*`
  namespace with a same-tab broadcast channel. `storage/StorageManager.js` owns `SCHEMA_VERSION` (=3),
  an idempotent non-destructive `migrate()`, defaults, and `exportAll/importAll`.
- **localStorage keys**: `emily.flashcards`, `emily.flashcardStats`, `emily.flashSession`,
  `emily.stats`, `emily.reflections`, `emily.garden` (`[{id:dna, ts}]`), `emily.grove`
  (`{unlocked:{}, plantNext}`), `emily.meter`, `emily.brainDump`, `emily.keepsakes`, `emily.verses`,
  `emily.spr`, `emily.mixer`, `emily.zen`, `emily.schemaVersion`, `emily.auth`, `emily.sync.meta`.
  Synced keys are listed in `sync/syncEngine.js` `SYNC_KEYS` (real progress only; device prefs/caches
  stay local).
- **Overlays** are lazy-loaded modals matching one pattern: `useFocusTrap`, aria-hidden backdrop
  `<button>`, `animate-modal-in`, responsive max-width. There are **no tabs**.
- **Shared utils**: `utils/timer.js` (timer math), `utils/day.js` (UTC day helpers; flashcard
  _scheduling_ uses LOCAL day boundaries in `data/scheduler.js`).

## Non-negotiables for any new work

- Reuse existing generators/components/tokens as the **single source of truth** (don't fork the art);
  keep the cozy pixel aesthetic + pixel font; **all copy original, no copyrighted text**.
- **No data loss**: persist under `emily.*`, bump `SCHEMA_VERSION` with a migration, add new synced
  keys to `SYNC_KEYS`, and they're auto-covered by Sanctuary backup.
- **WCAG AA**, keyboard-operable, focus-trapped overlays, `aria-live` for dynamic changes, honor
  `prefers-reduced-motion`. Convey state by more than colour.
- Preserve existing behavior; keep the suite green and add tests.

## Quality gates / tooling (all currently green)

- **Vitest (jsdom) + Testing Library + vitest-axe** — 122 tests; coverage ≥80% on core logic modules
  (`flashcards`, `scheduler`, `grove`, `encouragements`, `StorageManager`, `utils`), currently ~97%.
- **ESLint 9 (flat) + Prettier**; npm scripts: `lint`, `format(:check)`, `test(:run)`, `coverage`,
  `test:e2e`, `build`.
- **Playwright** e2e (desktop + mobile) and **Lighthouse** (Accessibility & Best-Practices hard
  ≥0.90; Performance tracked as a warning — the scene is deliberately animation-rich) — these run in
  **GitHub Actions CI** (the dev sandbox has no browser binaries). `.github/workflows/ci.yml` runs
  check + e2e + lighthouse; `deploy.yml` ships GitHub Pages; Cloudflare auto-deploys on push.
- Docs: `AUDIT.md`, `TESTING.md`, `CHANGELOG.md`, `.env.example`, this file.

## How to propose a feature here

Audit the relevant generator/store first; reuse the deterministic generator + shared renderer; tie
any reward/unlock to metrics already stored (or add minimal tracking); ship it behind the modal +
focus-trap pattern; version + migrate + sync the data; write unit + component(+axe) tests and a CI
e2e/screenshot; keep the look/feel and the suite green.
