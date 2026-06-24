import { test, expect } from '@playwright/test'

// Skip the one-time first-run intro so these journeys land straight on the dashboard.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true })))
})

// These run in CI (browsers installed there). They assert real-browser journeys
// and that no console errors occur during any run.

// Collect console errors per test; ignore benign noise (favicon, SW lifecycle).
function trackConsoleErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (/favicon|service worker|manifest|the React DevTools/i.test(text)) return
    errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}

// Each test runs in a fresh browser context, so localStorage already starts
// empty — no manual clearing needed (clearing on every navigation would also
// wipe data we persist mid-test, e.g. before a reload).

test('a finished focus session brings a letter from the sprite', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.clock.install()
  await page.goto('/')

  await page.getByRole('button', { name: 'Start' }).click()
  // Fast-forward the full 25-minute focus block (timestamp-based timer).
  await page.clock.fastForward(25 * 60 * 1000 + 2000)

  await expect(page.getByText('Session done.')).toBeVisible()
  // A reflection check-in overlay opens on completion — dismiss it (Esc) before
  // reaching for the sprite.
  const reflection = page.getByRole('dialog', { name: /session reflection/i })
  await reflection.waitFor()
  await page.keyboard.press('Escape')
  await expect(reflection).toBeHidden()

  // The sprite bobs and the fixed Dock can overlap its strip; dispatch the click
  // event straight to the button so it always reaches the handler regardless of
  // overlay or scroll position (force-click coordinates can miss off-screen).
  await page.getByRole('button', { name: /open a letter from the sprite/i }).dispatchEvent('click')
  await expect(page.getByRole('dialog', { name: /a letter for you/i })).toBeVisible()

  expect(errors).toEqual([])
})

test('flashcards: import, review, reload — schedule + progress persist', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/')

  await page
    .getByRole('button', { name: /flashcards/i })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Flashcards' })
  await expect(dialog).toBeVisible()

  // Import a small deck.
  await dialog
    .getByRole('button', { name: /import/i })
    .first()
    .click()
  await dialog.getByPlaceholder(/deck for these cards/i).fill('E2E')
  await dialog.getByPlaceholder(/one card per line/i).fill('alpha — first\nbeta — second')
  await dialog.getByRole('button', { name: /add cards/i }).click()

  // Review one card.
  await dialog.getByRole('button', { name: /review \d+ card/i }).click()
  await dialog.getByRole('button', { name: /show answer/i }).click()
  await dialog.getByRole('button', { name: /3\. Good/ }).click()

  // Reload and confirm progress persisted.
  await page.reload()
  const reviewed = await page.evaluate(() => JSON.parse(localStorage.getItem('emily.flashcardStats') || '{}'))
  expect(reviewed.total).toBeGreaterThanOrEqual(1)
  expect(errors).toEqual([])
})

test('backup: export, clear, re-import restores progress', async ({ page }) => {
  await page.goto('/')
  // Seed some data, then open the Guide which hosts the backup controls.
  await page.evaluate(() => localStorage.setItem('emily.brainDump', JSON.stringify('keep me safe')))
  await page.reload()
  await page
    .getByRole('button', { name: /how to use this app|guide/i })
    .first()
    .click()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download backup/i }).click(),
  ])
  const file = await download.path()

  // Wipe everything, then restore from the downloaded file.
  await page.evaluate(() => localStorage.clear())
  await page.setInputFiles('input[type="file"]', file)
  await expect(page.getByText(/restored \d+ item/i)).toBeVisible()

  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('emily.brainDump') || 'null'))
  expect(restored).toBe('keep me safe')
})

test('mobile smoke: the dashboard renders without console errors', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening), emily/i })).toBeVisible()
  await expect(page.getByText('25:00')).toBeVisible()
  expect(errors).toEqual([])
})
