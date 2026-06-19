# TESTING — Emily's Study Sanctuary

How to run every quality gate, and how the suite is organised.

## Commands

| Command                           | What it does                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run lint`                    | ESLint (flat config) over the repo — React, hooks, jsx-a11y. Zero errors expected. |
| `npm run format` / `format:check` | Prettier write / verify.                                                           |
| `npm test`                        | Vitest in watch mode (jsdom).                                                      |
| `npm run test:run`                | Vitest once (CI mode).                                                             |
| `npm run coverage`                | Vitest with v8 coverage + thresholds on the core logic modules.                    |
| `npm run test:e2e`                | Playwright end-to-end (desktop + mobile). **Requires browsers** — see below.       |
| `npm run build`                   | Production build (Vite + PWA).                                                     |

## Unit & component tests (Vitest + Testing Library + axe)

- Run in **jsdom**; setup in `src/test/setup.js` (jest-dom + `vitest-axe` matchers,
  `localStorage` reset between tests, canvas/matchMedia stubs).
- **Unit** (pure logic): `src/data/flashcards.test.js`,
  `src/data/encouragements.test.js`, `src/storage/StorageManager.test.js`
  (scheduler/parser, no-repeat selection bag, storage + migration).
- **Component / a11y:** `src/components/*.test.jsx` — render, keyboard, focus trap,
  and `axe` assertions.
- **Coverage gate:** ≥80% lines/functions/statements (≥75% branches) on the modules
  in `vitest.config.js` `coverage.include` (flashcards/scheduler, encouragements,
  StorageManager, utils). Current: ~92% statements.

## End-to-end (Playwright) — runs in CI

The sandbox/dev image here has **no browser binaries** and the Playwright download
CDN is network-blocked, so `npm run test:e2e` can't execute locally in this
environment. It runs in **GitHub Actions** (`.github/workflows/ci.yml`), where
`npx playwright install --with-deps` provides Chromium. To run locally on a normal
machine:

```bash
npx playwright install
npm run build && npm run test:e2e
```

Journeys covered: focus session → sprite letter; deck create → import → review →
reload persistence; backup export → clear → import restore; mobile smoke. The config
boots `vite preview` as the web server and asserts **no console errors**.

## Lighthouse — runs in CI

`@lhci/cli` (`lighthouserc.json`) asserts Performance / Accessibility /
Best-Practices ≥ 0.90 against the built `dist/`. Also browser-dependent, so it runs
in CI, not this sandbox.

## Manual accessibility pass (documented)

- **Keyboard-only:** Tab reaches every control; overlays trap focus and return it to
  the opener on close; Esc closes overlays; flashcards flip with Space and rate with
  1–4.
- **Screen reader:** timer status, card position/answer, and capture confirmations are
  announced via `aria-live`. Decorative scene/canvas are `aria-hidden`.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, animations are disabled
  and the weather canvas stays still.

## Environment notes

- Bible text is fetched at runtime (WEB by default). Tests **mock `fetch`** — no
  network needed. NIV requires a licensed key via `VITE_BIBLE_API_KEY` (see
  `.env.example`); it's optional and off by default.
