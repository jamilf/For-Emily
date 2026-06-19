import { defineConfig, devices } from '@playwright/test'

// End-to-end config. Browsers aren't available in the dev sandbox (the download
// CDN is network-blocked), so these run in CI (`npx playwright install --with-deps`).
// We build once and serve the static SPA with `vite preview` at root base.
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Calm all CSS animations so decorative motion (soot-sprite bob, etc.) can't
    // make elements "unstable" for the actionability checks.
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
