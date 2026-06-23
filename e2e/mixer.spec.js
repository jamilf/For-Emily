import { test, expect } from '@playwright/test'

// Sound & Music drawer — focus-music picker (UI + persistence only; we drive the
// controls and assert state survives a reload, without asserting actual audio,
// which the browser only permits behind a user gesture and can't verify headless).

test('choosing a focus-music style persists across a reload', async ({ page }) => {
  await page.goto('/')

  // Open the dock's Sound & Music drawer.
  await page.getByRole('button', { name: /sound & music/i }).click()
  const drawer = page.getByRole('dialog', { name: /sound & music/i })
  await expect(drawer).toBeVisible()

  // The focus-music picker offers the four styles plus Off.
  const group = drawer.getByRole('group', { name: /focus music style/i })
  await expect(group).toBeVisible()
  await expect(group.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true')

  // Pick Lofi; it becomes the pressed option.
  await group.getByRole('button', { name: 'Lofi' }).click()
  await expect(group.getByRole('button', { name: 'Lofi' })).toHaveAttribute('aria-pressed', 'true')

  // Reload: the choice is remembered.
  await page.reload()
  await page.getByRole('button', { name: /sound & music/i }).click()
  const drawer2 = page.getByRole('dialog', { name: /sound & music/i })
  await expect(
    drawer2.getByRole('group', { name: /focus music style/i }).getByRole('button', { name: 'Lofi' }),
  ).toHaveAttribute('aria-pressed', 'true')
})
