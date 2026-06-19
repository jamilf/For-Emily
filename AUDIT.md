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
