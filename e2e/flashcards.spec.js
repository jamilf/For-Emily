import { test, expect } from '@playwright/test'

// Flashcards recall-depth + friction features (CI; real browser). UI + persistence
// only — no audio/gesture concerns. Each context starts with empty localStorage,
// so the built-in SEED_CARDS are present on first open.

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

async function openFlashcards(page) {
  await page
    .getByRole('button', { name: /flashcards/i })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Flashcards' })
  await expect(dialog).toBeVisible()
  return dialog
}

test('quick review starts a session in one tap', async ({ page }) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/')
  const dialog = await openFlashcards(page)

  await dialog.getByRole('button', { name: /quick review/i }).click()
  await expect(dialog.getByText(/Reviewing 1 of/)).toBeVisible()
  expect(errors).toEqual([])
})

test('typed recall mode: type an answer, see correctness, rate, and persist across reload', async ({
  page,
}) => {
  const errors = trackConsoleErrors(page)
  await page.goto('/')

  // Import one deterministic card so the answer is known.
  let dialog = await openFlashcards(page)
  await dialog
    .getByRole('button', { name: /import/i })
    .first()
    .click()
  await dialog.getByPlaceholder(/deck for these cards/i).fill('E2E')
  await dialog.getByPlaceholder(/one card per line/i).fill('capital of France — Paris')
  await dialog.getByRole('button', { name: /add cards/i }).click()

  // Turn on typed mode and start.
  await dialog.getByLabel(/type my answers/i).check()
  await dialog.getByRole('button', { name: /review \d+ card/i }).click()

  await dialog.getByLabel(/type your answer/i).fill('paris')
  await dialog.getByRole('button', { name: /check answer/i }).click()
  await expect(dialog.getByText(/correct from memory/i)).toBeVisible()
  await dialog.getByRole('button', { name: /3\. Good/ }).click()

  await page.reload()
  const stats = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('emily.flashcardStats') || '{}'),
  )
  expect(stats.total).toBeGreaterThanOrEqual(1)
  // The typed-mode preference persisted too.
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('emily.flashPrefs') || '{}'))
  expect(prefs.typed).toBe(true)
  expect(errors).toEqual([])
})

test('micro-session preset persists the chosen size', async ({ page }) => {
  await page.goto('/')
  const dialog = await openFlashcards(page)
  await dialog.getByRole('button', { name: /just 5/i }).click()
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('emily.flashPrefs') || '{}'))
  expect(prefs.lastSize).toBe(5)
})
