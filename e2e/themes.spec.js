import { test, expect } from '@playwright/test'

// Scene Themes — unlock + pick a sky, and confirm the choice persists. UI and
// persistence only; the tint itself is decorative and verified by eye on the build.

test('unlocking and choosing a scene theme persists across a reload', async ({ page }) => {
  // Seed a grove past the Sakura threshold (5 trees) before the app boots.
  await page.addInitScript(() => {
    if (localStorage.getItem('__themeSeeded')) return
    localStorage.clear()
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 6 }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
    )
    localStorage.setItem('__themeSeeded', '1')
  })
  await page.goto('/')

  await page.getByRole('button', { name: /open scene themes/i }).click()
  const dialog = page.getByRole('dialog', { name: /scene themes/i })
  await expect(dialog).toBeVisible()

  // Sakura is unlocked at 6 trees; choose it.
  await dialog.getByRole('button', { name: /use the sakura theme/i }).click()
  await expect(dialog.getByText('Sakura').locator('..')).toContainText('Active')
  await dialog.getByRole('button', { name: /close themes/i }).click()

  // Reload: the choice is remembered.
  await page.reload()
  await page.getByRole('button', { name: /open scene themes/i }).click()
  const dialog2 = page.getByRole('dialog', { name: /scene themes/i })
  await expect(dialog2.getByText('Sakura').locator('..')).toContainText('Active')
})
