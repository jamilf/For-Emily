import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true })))
})

// Scene depth — the cozy windowsill frame is present and, sitting below the UI in
// the stack, never blocks interaction. We don't assert parallax transforms (visual
// depth is verified by eye on the live build); we assert the frame coexists with a
// fully usable UI.

test('the windowsill frames the scene without blocking the UI', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('[data-testid="windowsill"]')).toBeVisible()

  // A control that sits in front of the frame is still clickable through it.
  await page.getByRole('button', { name: /sound & music/i }).click()
  await expect(page.getByRole('dialog', { name: /sound & music/i })).toBeVisible()
})
