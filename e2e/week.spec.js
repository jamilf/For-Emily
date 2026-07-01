import { test, expect } from '@playwright/test'

// "Your week in the grove" (UI only, fully derived). Seed onboarded + minimal
// effects so the dashboard lands straight in, and seed one reflection so the
// look-back has something concrete to show (date-independent assertion).
test.use({ reducedMotion: 'reduce' })
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true, effects: 'minimal' }))
    localStorage.setItem(
      'emily.reflections',
      JSON.stringify([{ ts: Date.now(), mood: 'sun', note: 'E2E felt clear today' }]),
    )
  })
})

test('the Focus Meter opens a weekly reflection that surfaces past check-ins', async ({ page }) => {
  await page.goto('/')

  // The weekly reflection opens from the Focus Meter, beside the Firefly Calendar.
  await page.getByRole('button', { name: /your week/i }).click()
  const panel = page.getByRole('dialog', { name: /your week/i })
  await expect(panel).toBeVisible()

  // The reflection recorded above is shown back to her.
  await expect(panel.getByText('E2E felt clear today')).toBeVisible()

  // It closes cleanly and returns to the dashboard.
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
