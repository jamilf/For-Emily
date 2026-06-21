# AUDIT — Emily's Study Sanctuary

_Phase 0 audit. Read-only assessment of the app as it actually exists, before the
optimise/harden/test work. Findings are grouped by category with a severity and a
one-line fix; the ordered execution plan is at the end._

> **Brief vs. reality.** The task brief describes an older build (a "Book Nook"
> reading list, a "Mind's Garden" with facts, hardcoded quotes). Those were removed
> in earlier work. This audit targets the **current** app. Where the brief's
> language is mapped onto current features, it's noted.

## 1. Component & module map

```
main.jsx → <App> (StrictMode)
  App.jsx
    migrate() on boot (StorageManager)
    <SyncProvider>            sync/SyncProvider.jsx  (Supabase email-OTP + auto-sync)
      <AudioMixerProvider>    audio/AudioMixerProvider.jsx (Web Audio, 7 layers)
        <Dashboard>
          <SkyScene>          scene/SkyScene.jsx     (decorative pixel landscape)
          <WeatherCanvas>     components/WeatherCanvas.jsx (rain/thunder canvas)
          <Header> → <Toolbar>  focus/flashcards/guide/sync chips
          <PomodoroTimer>     timer + plant growth + soot-sprite letter
            ⤷ lazy <LetterModal>, <ReflectionModal>
          <FocusMeter>, <FocusGarden>   right rail
          <BrainDump>         floating notepad
          <Dock>              mixer toggle, flashcards, zen
          lazy: <AmbientMixerDrawer>, <Flashcards>, <GuideModal>, <SyncModal>
```

Supporting modules: `pixel/` (PixelSprite, PlantGenerator, sprites), `data/`
(flashcards, encouragements, scripture, breakActivities), `hooks/`
(useLocalStorage, useEscapeKey, usePageHidden), `storage/StorageManager`,
`weather/WeatherEngine`, `audio/ambientLayers`.

## 2. State model

- **Local UI state (App/Dashboard):** `focusMode`, `focusActive`, `showCards`,
  `showGuide`, `showSync`, `openDrawer`. Persisted UI: `zen`.
- **Persisted domain state** via `usePersistedState(key, initial)` (localStorage +
  same-tab `emily:storage` broadcast + cross-tab `storage` event).
- **Sync:** when signed in, `SyncProvider` mirrors a subset of keys to a per-user
  Supabase row with per-key last-write-wins.

## 3. Every `localStorage` key

| Key                    | Shape                                                    | Synced?  | Written by                  |
| ---------------------- | -------------------------------------------------------- | :------: | --------------------------- |
| `emily.flashcards`     | `Card[]`                                                 |    ✓     | Flashcards                  |
| `emily.flashcardStats` | `{day,reviewedToday,streak,lastReviewDay,correct,total}` |    ✓     | Flashcards                  |
| `emily.stats`          | `{day,minutesToday,sessionsToday,streak,lastStudyDay}`   |    ✓     | PomodoroTimer               |
| `emily.reflections`    | `{ts,mood,note}[]`                                       |    ✓     | PomodoroTimer               |
| `emily.garden`         | `{id,ts}[]`                                              |    ✓     | PomodoroTimer / FocusGarden |
| `emily.meter`          | `{dailyGoalMin}`                                         |    ✓     | FocusMeter                  |
| `emily.brainDump`      | `string`                                                 |    ✓     | BrainDump                   |
| `emily.keepsakes`      | `{id,text,ref,type,signoff,ts}[]`                        |    ✓     | LetterModal                 |
| `emily.mixer`          | `{enabled,master,levels{…}}`                             | ✗ device | AudioMixerProvider          |
| `emily.zen`            | `boolean`                                                | ✗ device | Dashboard                   |
| `emily.spr`            | `{seen[],lastOpenDay}`                                   | ✗ device | LetterModal                 |
| `emily.verses`         | `{[ref]:text}`                                           | ✗ cache  | LetterModal                 |
| `emily.schemaVersion`  | `number` (=2)                                            |    ✗     | StorageManager.migrate      |
| `emily.auth`           | Supabase session                                         |    ✗     | Supabase SDK                |
| `emily.sync.meta`      | `{[key]:epochMs}`                                        |    ✗     | syncEngine                  |

## 4. Findings

### Bugs

- **[High] Timer drift on tab-backgrounding** — `PomodoroTimer.jsx:71-75` counts down
  with `setInterval(…, 1000)` decrementing a counter; throttled background tabs
  desync it. → Derive remaining time from a stored `endsAt` timestamp + `Date.now()`.
- **[Low] `parseBulk` colon separator** — `flashcards.js:175` treats a bare `:` as a
  separator, so times/ratios in a term split wrongly. → Acceptable; document, and
  prefer dash separators first (already ordered).

### Performance

- **[Low] `SkyScene` not memoized** — re-renders with the dashboard though its inputs
  change only hourly. → Wrap in `React.memo`.
- **[Info] Code-splitting already solid** — overlays are `React.lazy`; React is a
  separate `vendor` chunk (`vite.config.js`). Keep.
- **[Info] Plant/letter memoization correct** — `PomodoroTimer` memoizes plant
  generation on stage, not the 1s tick.

### Accessibility

- **[High] No focus trap / return-focus in overlays** — modals set `role="dialog"` +
  `aria-modal` and focus the close button, but Tab escapes to the background. → Add a
  shared `useFocusTrap` (Tab cycle + Esc + return focus) to every overlay. **(fixed
  in this pass)**
- **[Med] Click-outside backdrop was a non-interactive `<div>` with handlers** →
  Converted to an `aria-hidden`, `tabIndex=-1` `<button>`. **(fixed)**
- **[Med] Missing SR announcements on flashcard flip/rate** — partial `aria-live`
  exists; ensure flip + reschedule are announced. → Phase 3.
- **[Info] `prefers-reduced-motion`** honored in `index.css` + WeatherCanvas. Keep.

### Robustness

- **[High] No React error boundary** — any render throw white-screens the app. → Add
  a top-level `<ErrorBoundary>` with an in-theme fallback.
- **[Low] No backup/restore** — no way to export/import the `emily.*` namespace; a
  cleared browser (when signed out) loses everything. → Add export/import + a real
  `migrate()`.
- **[Good] Storage + fetch already defensive** — `useLocalStorage` and
  `StorageManager.read` guard parse/quota; `scripture.fetchVerses` catches per-ref and
  falls back to original encouragements. Keep.

### Security

- **[Low] Supabase anon key has a committed fallback** — `sync/config.js`. It's a
  publishable key and RLS is the real firewall; env override exists. → Document in
  `.env.example`; leave fallback for zero-config deploys.
- **[Good] No `dangerouslySetInnerHTML`, no `eval`**, all user text rendered as text.

### Code quality / Dead code

- **[Low] Duplicated `dayStr`/`yesterdayStr`** in `flashcards.js` and `PomodoroTimer`;
  duplicated `shuffle`. → Extract shared `utils/` (RNG/shuffle, day helpers). Phase 2/3.
- **[Fixed] Unused `reflections`/`garden` values** in PomodoroTimer; **`<nav role=
"toolbar">`** in Dock; **ref-in-cleanup** in AudioMixerProvider.

### Corrected from the automated sweep

- The WeatherCanvas `matchMedia('change')` listener **is** removed on cleanup
  (`WeatherCanvas.jsx:36`) — not a leak. Verified against source.

## 5. Execution plan

1. **Phase 1 — foundation (this pass):** Vitest+jsdom+RTL+axe, ESLint(flat)+Prettier,
   coverage thresholds, scripts, `useFocusTrap`, characterization + unit tests, docs.
2. **Phase 2 — harden:** timestamp timer, `ErrorBoundary`, backup export/import + real
   `migrate()`, shared utils, `SkyScene` memo, NIV-config switch + `.env.example`.
3. **Phase 3 — flashcards (TDD):** local day-boundary scheduling, new-card cap,
   session resume, undo, edit/delete-in-review, deck management, search, JSON/CSV
   export, leech care, kind analytics, swipe + SR announcements, 1k-card perf.
4. **E2E + Lighthouse + CI:** Playwright specs + Lighthouse wired to GitHub Actions
   (cannot run in this sandbox — no browser binaries); jsdom gates run locally.

## 6. Phase 11 audit — Firefly Calendar (focus-consistency map)

Read-only audit before building the calendar. Where the feature prompt disagreed with the
codebase, **the codebase won** — noted here.

- **Schema version.** `SCHEMA_VERSION` was **3** (`storage/StorageManager.js`), bumped to **4**
  with an additive `if (current < 4)` block mirroring the v2→v3 Grove seed. Idempotent +
  non-destructive (only adds garden-derived days absent from `emily.focusLog`; never overwrites a
  live day; mutates no other key).
- **Streak source.** The prompt said `emily.meter`/`emily.stats`; in reality the streak lives in
  **`emily.stats.streak`** (`emily.meter` is only `{ dailyGoalMin }`). It is computed once in
  `PomodoroTimer.recordFocusSession()`. The calendar **reuses** `stats.streak` via
  `summarize(log, { streak })` — never recomputed, so it can't diverge from the Focus Meter.
- **Local-day helper already existed.** No new `utils/localDay.js` was added — `data/focusLog.js`
  reuses **`localDayStr`** from `data/scheduler.js` (local, wall-clock; `utils/day.js` stays UTC for
  streak bookkeeping). DST-safe: `localDayStr` reads calendar fields (year/month/date).
- **Focus length is not user-configurable.** The prompt asked for "the configured focus length"; the
  app has no per-session duration setting — it's the module constant `FOCUS_MINUTES = DURATIONS.focus /
60` in `PomodoroTimer.jsx`. `recordSession` is given that constant (derived from `DURATIONS.focus`,
  not a literal `25`), so it stays correct if the focus duration ever changes.
- **Backup auto-covers the new key.** `exportAll`/`importAll` iterate all `emily.*` keys (excluding only
  auth + sync meta), so `emily.focusLog` is backed up/restored with no StorageManager change. Asserted
  in tests anyway. `emily.focusLog` was added to `SYNC_KEYS` (per-key LWW).
- **Modal pattern reused verbatim.** `useFocusTrap(true, { onEscape, initialFocus })` + aria-hidden
  backdrop `<button>` + `animate-modal-in` + `role="dialog"` + lazy import — mirrors `GuideModal.jsx`.
- **Art constraints respected.** Fireflies/cells are pure CSS (`box-shadow`/Tailwind tokens) + emoji —
  no image/audio assets. No new palette hexes: dusk uses existing `bg*` tokens, glow uses the existing
  `ever-green`/`ever-yellow` tokens.
- **Optional secondary entry (FocusGarden) skipped** to keep scope tight; the Focus Meter entry point is
  the single launch surface, matching the prompt's primary requirement.

## 7. Phase 12 audit — Forest Spirits (collectible companions, +persisted state)

Read-only audit before building. Resolved flags from the prompt:

- **`flashcardStats.total` is a true cumulative lifetime counter** (incremented every `recordReview`
  in `src/data/flashcards.js`, never reset) → Scholar (200 reviews) is derivable retroactively with
  **no forward-only counter needed**. This is the only data point the prompt flagged as possibly missing.
- **`emily.spr`** (`{seen, lastOpenDay}`, sprite-letter state) is unrelated to `emily.spirits` → no collision.
- **`SCHEMA_VERSION` was 4** → bumped to **5** with an additive `if (current < 5)` guard.
- **Night Owl "after 8pm" boundary (confirmed with the user):** local hour `>= 20 || < 5` (8pm–4:59am),
  matching the Grove's existing `afterDark` lower bound. The before-noon (`h<12`) and after-8pm windows
  intentionally overlap for after-midnight hours.

Design decisions:

- **One unlock engine, not a parallel one.** `src/data/grove.js`'s `progressFor` and `reconcile` were
  generalized backward-compatibly (`progressFor` reads `metrics[rule.metric]` generically; `reconcile`
  takes an optional `catalogue`). The Spirits reuse this exact sticky+retroactive engine via
  `reconcileSpirits`; the Grove's existing behaviour and tests are unchanged.
- **Persisted shape `emily.spirits = { unlocked, seen, discoveredAt }`** (the only new key this feature
  adds). Retroactively seeded spirits get `discoveredAt = null` (UI shows "—") — history is never
  fabricated. Added to `SYNC_KEYS`; backup auto-covers all `emily.*`.
- **Art reuses the pixel primitive** (`PixelSprite` + a new deterministic `SpiritGenerator` mirroring
  PlantGenerator's `mulberry32`+`decode`), recoloured to a single silhouette tone when locked — no tree
  fork, no image assets, no new palette hexes.
- **Entry point** is a self-hosted lazy modal in `FocusGarden.jsx` (mirrors how `FocusMeter` hosts the
  Firefly Calendar), so no Dashboard wiring was required.

## 8. Phase 13 audit — Memory Grove (dedicate a harvested tree, +persisted state)

Read-only audit before building. Confirmed conventions, all reused:

- **Garden / tree identity:** `emily.garden = [{ id, ts }]`; `tree.id` IS the DNA passed to the shared
  `ProceduralTree` (`{ dna, stage='mature', pixel, state, className }`). Memories render through that same
  component — **no alternate tree renderer**.
- **New-item id:** `Date.now() + Math.random()` (matches `flashcards.js` `makeCard`).
- **UI patterns reused:** search box (trim+lowercase substring, `Flashcards.jsx`), labelled textarea
  (`BrainDump.jsx`), inline edit form Save/Cancel (`Flashcards.jsx`), inline delete confirm "Yes/Keep"
  (`FocusGarden.jsx` — chosen over `window.confirm` to keep focus inside the modal trap).
- **No `dna → species` reverse lookup existed** → added `speciesForDna(dna)` to `src/data/grove.js`
  (reuses `SPECIES` + `dnaOf`); `PlantGenerator.decode` is private and wasn't needed.
- **`SCHEMA_VERSION` was 5** → bumped to **6** with an additive ensure-exists guard (Memory Grove is
  user-authored, so nothing is backfilled; re-running is a no-op and never overwrites real memories).
- **Persisted shape `emily.memories = [{ id, dna, ts, title, note }]`** — the only new key. Added to
  `SYNC_KEYS` (per-key LWW, like `emily.keepsakes`/`emily.garden`); Sanctuary backup auto-covers it.
- **Entry point** is a self-hosted lazy modal in `FocusGarden.jsx` (sibling to the Almanac / Forest
  Spirits buttons), so no Dashboard wiring was required.

## 9. Phase 14 audit — Journal (derived timeline, no new state)

Read-only audit before building. The Journal is the first **DERIVED** feature of the expansion, so per the
locked decision it adds **no new persisted key, no `SYNC_KEYS` change, and no migration** — it only reads
existing stores. Confirmed shapes reused as-is:

- `emily.memories` `[{id,dna,ts,title,note}]` · `emily.garden` `[{id,ts}]` · `emily.keepsakes`
  `[{id,text,ref,type,signoff,ts}]` · `emily.reflections` `[{ts,mood,note}]` (mood rain/cloud/sun) — ts epoch ms.
- `emily.spirits.discoveredAt` `{[id]: ts|null}` (null = retroactive → shown undated, never dated).
- `emily.grove.unlocked` `{[id]: 'YYYY-MM-DD'}` — a date STRING; converted to a sortable local-midnight ts.
- Reused `SPIRITS_BY_ID` (spirits.js) and `SPECIES_BY_ID`/`dnaOf` (grove.js) for names + tree DNA; rendered
  via the shared `ProceduralTree`/`ProceduralSpirit` (no new art).
- Entry point: a global "📔 Journal" chip in the header `Toolbar` (threaded `onOpenJournal` from `App.jsx`),
  matching the existing Guide/Sync chips — the modal lazy-loads in the shared top-level `<Suspense>`.
- Curation choices documented in code: reflections without a note are skipped (a mood alone isn't a journal
  entry); growth milestones are emitted only at `MILESTONES` thresholds (1, 10, 25, 50, 100, …) to avoid
  flooding the timeline with every session.
