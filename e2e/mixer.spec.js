import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true })))
})

// Sound & Music drawer — focus-music picker (UI + persistence only; we drive the
// controls and assert state survives a reload, without asserting actual audio,
// which the browser only permits behind a user gesture and can't verify headless).

test('choosing a focus-music mood persists across a reload', async ({ page }) => {
  await page.goto('/')

  // Open the dock's Sound & Music drawer.
  await page.getByRole('button', { name: /sound & music/i }).click()
  const drawer = page.getByRole('dialog', { name: /sound & music/i })
  await expect(drawer).toBeVisible()

  // The focus-music picker is a labeled select, Off by default.
  const picker = drawer.getByRole('combobox', { name: /focus music/i })
  await expect(picker).toHaveValue('off')

  // Pick a chiptune mood; the now-playing hint reflects it.
  await picker.selectOption('latenight')
  await expect(picker).toHaveValue('latenight')
  await expect(drawer.getByText(/now playing: late-night library/i)).toBeVisible()

  // Reload: the choice is remembered.
  await page.reload()
  await page.getByRole('button', { name: /sound & music/i }).click()
  const drawer2 = page.getByRole('dialog', { name: /sound & music/i })
  await expect(drawer2.getByRole('combobox', { name: /focus music/i })).toHaveValue('latenight')
})
