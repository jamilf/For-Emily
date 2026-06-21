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

## Phase 12 — Forest Spirits (collectible companions)

- `src/data/spirits.js` — new: the `SPIRITS` catalogue (Curiosity, Dawn, Night Owl, Persistence,
  Reflection, Scholar) + `spiritMetrics` (count-based before-noon / after-8pm, streak, reflections,
  reviews — all derived from existing stores), `progressForSpirit`/`hintForSpirit`, and
  `reconcileSpirits` (sticky + retroactive; live unlocks stamp `discoveredAt`, retroactive seeds stay
  `null` so no history is fabricated). Pure + fully unit-tested.
- `src/data/grove.js` — generalized the unlock engine (backward-compatibly) so it powers BOTH the Grove
  and the Spirits: `progressFor` now evaluates any `metrics[rule.metric]` generically, and `reconcile`
  takes an optional `catalogue` param (defaults to `SPECIES`). Existing Grove behaviour/tests unchanged.
- `src/pixel/SpiritGenerator.js` — new: a deterministic creature generator that reuses the shared pixel
  primitive (mirrors PlantGenerator's seeded `mulberry32` + `decode`; NOT a tree fork). `generate(seed,
paletteKey)` → original silhouettes (body × ears × accent) painted only from existing palette tokens.
- `src/components/ProceduralSpirit.jsx` — new: shared renderer mirroring `ProceduralTree` (memoized,
  `aria-hidden`, `state="locked"` → single-tone silhouette).
- `src/components/ForestSpiritsModal.jsx` — new: lazy, focus-trapped modal (same chrome as the Almanac).
  Reconciles on open with an `aria-live` "a spirit found you" celebration; grid of unlocked companions
  (idle float, discovery date, "new!" via `seen`) and locked silhouettes (🔒 + hint + progress); All/
  Found/Locked filter; detail view. State conveyed by text + shape, never colour alone; honors
  `prefers-reduced-motion` (static idle). Original art + copy.
- `src/components/FocusGarden.jsx` — adds a "🌲 Forest Spirits" entry point (self-hosted lazy modal).
- `src/storage/StorageManager.js` — `emily.spirits` default + schema **v4 → v5** migration that seeds
  spirits retroactively from existing metrics (idempotent, non-destructive, undated). `src/sync/syncEngine.js`
  — `emily.spirits` added to `SYNC_KEYS`; Sanctuary backup covers it automatically.
- `vitest.config.js` — `src/data/spirits.js` + `src/pixel/SpiritGenerator.js` added to coverage `include`.
- Tests: spirits unit suite (incl. local-time boundary edges, retroactive/sticky/dated, double-run no-op)
  - generator determinism + v4→v5 migration & backup + `SYNC_KEYS` + ForestSpirits component/axe suite
    (keyboard, "new!", reduced-motion) + `e2e/spirits.spec.js` (desktop + mobile screenshots). 177 tests;
    ~97% coverage on core modules.

## Phase 13 — Memory Grove (dedicated-tree keepsakes)

- `src/data/memories.js` — new: pure helpers for the `emily.memories` list —
  `createMemory` (trimmed fields, `Date.now()+Math.random()` id, immutable), `updateMemory`,
  `deleteMemory`, `searchMemories` (case-insensitive over title + note). Fully unit-tested.
- `src/data/grove.js` — adds `speciesForDna(dna)` (reverse of `dnaOf`) so a memory card can name its
  tree's varietal + flavor; falls back to "Wild varietal" for un-named DNA. Existing behaviour unchanged.
- `src/components/MemoryGroveModal.jsx` — new: lazy, focus-trapped modal (same chrome as the Almanac)
  with three keyboard-accessible views — a **searchable list** of memories (each rendered via the shared
  `ProceduralTree`, with title, note, species, and grown-date), a **tree picker** (undedicated garden
  trees, deduped by `ts`), and a **create/edit form** (title input + note textarea, Save disabled until a
  title). Inline delete confirm, `aria-live` status, state by text + shape (never colour alone).
- `src/components/FocusGarden.jsx` — adds a "🌳 Memory Grove" entry point (self-hosted lazy modal).
- `src/storage/StorageManager.js` — `emily.memories` default + schema **v5 → v6** additive guard that
  ensures the key exists (user-authored — nothing to backfill; idempotent, non-destructive).
  `src/sync/syncEngine.js` — `emily.memories` added to `SYNC_KEYS`; backup covers it automatically.
- `vitest.config.js` — `src/data/memories.js` added to coverage `include`.
- Tests: memories unit suite (create/update/delete/search) + `speciesForDna` + v5→v6 migration & backup
  round-trip + `SYNC_KEYS` + MemoryGrove component/axe suite (search, dedicate flow, edit, delete,
  keyboard) + `e2e/memories.spec.js` (desktop + mobile screenshots). 201 tests; ~97% coverage on core.

## Phase 14 — Journal (derived timeline)

- `src/data/journal.js` — new: pure, DERIVED timeline builder. `buildJournal({memories, spirits, grove,
garden, keepsakes, reflections})` weaves existing data into one reverse-chronological list — dedicated
  memories, dated spirit discoveries, varietal unlocks (grove 'YYYY-MM-DD' → local-midnight ts), kept
  letters, written reflections (note-bearing only), and growth milestones (the Nth harvested tree). Returns
  `{ entries (newest-first), undated }`; retroactively-met spirits (`discoveredAt: null`) go to `undated`
  with no fabricated date. `searchJournal` filters title+detail. Fully unit-tested.
- `src/components/Journal.jsx` — new: lazy, focus-trapped modal (same chrome as the rest). A derived
  summary (memories / spirits / varietals / letters / days studied / streak), a search box with an
  `aria-live` count, and the timeline grouped under month headings — each entry shown with its emoji icon
  - the shared `ProceduralTree`/`ProceduralSpirit` art + title + date + detail (conveyed by text + icon +
    shape, never colour alone). Undated group at the end ("From before your journal began", shown with "—").
    Warm empty state; reduced-motion safe; zero axe violations.
- `src/App.jsx` / `src/components/Header.jsx` / `src/components/Toolbar.jsx` — a global "📔 Journal" toolbar
  chip (threaded `onOpenJournal`); the modal lazy-loads + renders in the existing top-level `<Suspense>`.
- `vitest.config.js` — `src/data/journal.js` added to coverage `include`.
- **No new persistence, no sync, no migration** — the Journal is purely derived (locked-decision compliant).
- Tests: journal unit suite (each entry kind, sort, grove date→ts, reflection note-filter, milestones,
  search) + Journal component/axe suite (summary, month grouping, undated "—", search, empty state,
  keyboard) + `e2e/journal.spec.js` (desktop + mobile screenshots). 218 tests; ~97% coverage on core.

## Phase 15 — Constellations (derived night-sky)

- `src/data/constellations.js` — new: pure, DERIVED catalogue of nine original constellations, each with a
  star shape + a cumulative `rule`. `constellationMetrics({garden, focusLog, flashcardStats, reflections,
memories, spirits})` derives non-decreasing counts (sessions, active days, mornings `<12`, nights
  `>=20||<5`, reviews, reflections, memories, spirits). `buildSky` resolves each constellation via the
  reused grove `progressFor`, lighting `litStars` in proportion to progress and flagging `formed` at the
  threshold. Because every metric only grows, constellations never dim. Fully unit-tested.
- `src/components/Constellations.jsx` — new: lazy, focus-trapped modal. A decorative dusk-sky `<svg>`
  (`aria-hidden`) draws each constellation — lit stars (twinkle unless reduced-motion) + connecting lines +
  a name label once formed, over deterministic ambient stars — and an equivalent accessible `<ul>` carries
  all state in text + shape (`✦ Formed` vs `N of M stars lit`, with `current / target`), plus an
  `aria-live` "N of M formed" summary. State never by colour alone; SVG-only (no assets); zero axe.
- `src/App.jsx` / `src/components/Header.jsx` / `src/components/Toolbar.jsx` — a global "🌌 Constellations"
  toolbar chip (threaded `onOpenConstellations`); the modal lazy-loads in the existing top-level `<Suspense>`.
- `vitest.config.js` — `src/data/constellations.js` added to coverage `include`.
- **No new persistence, no sync, no migration** — purely derived (locked-decision compliant). Reuses the
  grove `progressFor` engine and the `.animate-twinkle` keyframe.
- Tests: constellations unit suite (metric boundaries, proportional star lighting, threshold forming, empty
  safety) + Constellations component/axe suite (summary, formed/partial text, decorative sky aria-hidden,
  reduced-motion, keyboard) + `e2e/constellations.spec.js` (desktop + mobile screenshots). 231 tests; ~97%
  coverage on core.

## Phase 16 — Sanctuary Seasons (derived world-shift)

- `src/data/seasons.js` — new: pure, DERIVED season logic. `SEASON_THRESHOLDS = { summer: 8, autumn: 20,
winter: 40 }` (a single tunable constant, tuned gentle for the gift), `SEASONS` (Spring→Winter, each with
  name/emoji/blurb + a subtle low-opacity tint token), `seasonForHarvest(total)` (boundary-correct: reaching
  a threshold advances), and `seasonProgress(total)` ("N more trees until Winter"). Derived from
  `emily.garden.length`; nothing new is persisted. Fully unit-tested incl. boundary values.
- `src/components/SeasonLayer.jsx` — new: a decorative `aria-hidden`, `pointer-events-none` overlay placed
  behind the content. A **bottom-weighted** tint (transparent at the top so header text contrast is
  untouched) + ~8 gentle drifting particles (petals/motes/leaves/snow, tokenized colours). Honors
  `prefers-reduced-motion` by rendering no particles (the static tint + label still convey the season).
- `src/components/SeasonsModal.jsx` — new: a lazy, focus-trapped field guide listing all four seasons, the
  current one marked in text (`✦ Now`), and a friendly progress line. State by name + text, never colour
  alone; zero axe.
- `src/index.css` — one small `seasonFall` keyframe (decorative; covered by the global reduced-motion rule).
- `src/App.jsx` / `src/components/Header.jsx` — Dashboard derives `season` from the garden count, adds a
  `season-<id>` root class (semantic hook), renders `<SeasonLayer/>` behind the scene, and the header shows
  a season label button ("🍂 Autumn") that opens the lazy `SeasonsModal`.
- `vitest.config.js` — `src/data/seasons.js` added to coverage `include` (measured at 100%).
- **No new persistence, no sync, no migration** — purely derived (locked-decision compliant). Effects are
  subtle and preserve AA text contrast; the season is conveyed by name; reduced-motion honored.
- Tests: seasons unit suite (threshold/boundary mapping, progress-to-next, name-not-colour + tint-subtlety
  guarantees) + SeasonLayer (aria-hidden/pointer-events-none, particles gated on reduced-motion) +
  SeasonsModal component/axe suite + `e2e/seasons.spec.js`. 248 tests; ~97% coverage on core.

## Phase 17 — Focus Quest Board (derived daily objectives)

- `src/data/quests.js` — new: pure, DERIVED quest logic. `DAILY_QUEST_COUNT` (3) + `QUEST_POOL` (five
  distinct-metric templates). `dailyQuests(localDate)` returns a deterministic set via a seeded `mulberry32`
  (FNV-1a hash of the local date) — same local date → identical quests, different dates differ.
  `questMetricsToday({garden, flashcardStats, reflections}, now)` computes live counts (trees/reflection/
  before-noon/after-dark by **local** day; reviews gated by the UTC `dayStr` the flashcard stats were stamped
  with). `evaluateQuests` reuses grove's generic `progressFor`; `questSummary` tallies. No I/O, no persistence,
  no expiry, no fail state. 100% covered.
- `src/components/QuestBoard.jsx` — new: lazy, focus-trapped modal. A gentle "N of M quests tended today"
  header (`aria-live`) with explicit "nothing to fail, no streak to break" framing; each quest row shows its
  state in **text + icon** (`✓ Done` / `current / target` / "Not yet") — never colour alone, no red/fail
  styling. When all are done, a cosmetic `aria-live` celebration with an `animate-pixel-pop` flourish (gated
  off under reduced motion) that optionally nods to an unlocked `ProceduralSpirit` but works without one.
- `src/App.jsx` / `src/components/Header.jsx` / `src/components/Toolbar.jsx` — a global "📜 Quests" toolbar
  chip (threaded `onOpenQuests`); the modal lazy-loads in the existing top-level `<Suspense>`.
- `vitest.config.js` — `src/data/quests.js` added to coverage `include`.
- **No new persistence, no sync, no migration** — purely derived (locked-decision compliant). No new
  currency/energy/streak; completion only reflects that real study metrics advanced (which already feed
  Spirits/Constellations).
- Tests: quests unit suite (per-local-date determinism, distinct metrics, target sets, local-day metric
  boundaries incl. the UTC reviews gate, evaluation) + QuestBoard component/axe suite (no-fail framing,
  all-done celebration, reduced-motion, keyboard) + `e2e/quests.spec.js`. 263 tests; ~97% coverage on core.

### Expansion complete

This is the sixth and final feature of the Sanctuary expansion (Forest Spirits, Memory Grove, Journal,
Constellations, Sanctuary Seasons, Focus Quest Board). Persisted+synced state added across the whole set:
**only `emily.spirits` and `emily.memories`** — everything else is derived.

## Phase 18 — Verification + responsive / mobile-scroll hardening (no new features)

A non-destructive QA + responsive pass over the completed expansion. Invariants verified intact
(persisted+synced = `emily.spirits` + `emily.memories` only; `SCHEMA_VERSION` 6 coherent + idempotent;
derived features persist nothing; `emily.spr` ≠ `emily.spirits`; backup round-trips). Surgical fixes:

- `src/hooks/useScrollLock.js` — new: ref-counted, iOS-safe body scroll lock (pins the body, captures +
  restores scroll position, compensates for the scrollbar, `overscroll-behavior: contain`). Wired into
  `src/hooks/useFocusTrap.js` so **every** focus-trapped modal locks the background in one place (the
  non-modal ambient Drawer is intentionally left scrollable).
- `index.html` — viewport meta gains `viewport-fit=cover`.
- `src/index.css` — `@media (max-width:640px){ input,textarea,select{ font-size:16px } }` prevents iOS
  focus auto-zoom (desktop sizing unchanged); `.pb-safe`/`.pt-safe` safe-area helpers.
- Safe-area insets via `env(safe-area-inset-*)`: `src/App.jsx` (root → `min-h-[100dvh]` + top inset),
  `src/components/Dock.jsx` and `BrainDump.jsx` (bottom/right insets clear the home indicator).
- `src/components/FireflyCalendar.jsx` — the horizontal meadow scroll region gains `overscroll-x-contain`
  so it can't rubber-band the page.
- `src/test/setup.js` — stubs `window.scrollTo` (jsdom) for the scroll-lock restore.
- Tests: `src/hooks/useScrollLock.test.jsx` (lock/restore + ref-count), a body-lock assertion in
  `QuestBoard.test.jsx`, and `e2e/responsive.spec.js` (desktop + mobile: per-modal opens, **no horizontal
  page overflow**, **background scroll-locked**, internal scroll region, Esc closes + returns focus,
  screenshots). 267 tests; ~97% coverage on core.

### Living World expansion — complete (6 features + hardening)

Forest Spirits, Memory Grove, Journal, Constellations, Sanctuary Seasons, Focus Quest Board — plus this
verification/responsive pass. Schema 3→6; the suite grew 122 → 267 tests, all green.

## Phase 19 — copy cleanup: de-AI the voice + remove em dashes

A non-destructive copy pass. Authored, user-facing strings were rephrased to read like warm, human
writing and every em dash (U+2014) in displayed copy was removed by rewriting, never by character
swaps. No behaviour, store keys, data shapes, migrations, sync, or selection logic changed — only
string values. Scripture/Bible-API/quoted content was left untouched (verse text and the `— {ref}`
citations in `LetterModal.jsx` are deliberately preserved), as was the `parseBulk` em-dash separator
(parsing behaviour) and the `For Emily Tran. You've got this.` dedication.

- `src/data/encouragements.js` — ~36 message strings rephrased to drop em-dash asides; the rotating
  `SIGNOFFS` lost their leading "— " (e.g. `your soot friend, always`).
- `src/data/{grove,seasons,constellations,journal}.js` — varietal flavor/hints, season + constellation
  blurbs, and the kept-verse journal title reworded without em dashes.
- `src/components/{QuestBoard,MemoryGroveModal,ForestSpiritsModal,GroveAlmanac,FireflyCalendar,Flashcards,SeasonsModal,Constellations,Journal,SyncModal,Header,GuideModal,BackupControls}.jsx`
  — displayed copy, aria-labels, and live-region strings reworded; standalone "—" placeholders became
  short words (`undated`, `none yet`, `n/a`). Bulk-import hints now teach `term - definition`.
- `src/copy-noemdash.test.js` — new guardrail: strips comments, then fails if an em dash appears in any
  authored copy under `src/data` / `src/components` (allowlisting the parse separator + scripture refs).
- Tests updated for changed copy: `src/data/journal.test.js`, `src/components/{Flashcards,Journal,QuestBoard}.test.jsx`.
- Gates green: lint, format, full suite + the new guardrail, ~97% coverage, build.
