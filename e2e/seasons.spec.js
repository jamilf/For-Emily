import { test, expect } from '@playwright/test'

// Sanctuary Seasons journey + screenshots (desktop + mobile). Runs in CI. Seeds the
// garden past the Autumn threshold so the world has clearly shifted.

test('Sanctuary Seasons opens from the Grove hub and marks the current season', async ({
  page,
}, testInfo) => {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|service worker|manifest|React DevTools/i.test(m.text())) {
      errors.push(m.text())
    }
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.addInitScript(() => {
    localStorage.clear()
    // 22 harvested trees → Autumn (>= 20).
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 22 }, (_, i) => ({ id: i, ts: Date.now() - i * 3600000 }))),
    )
  })
  await page.goto('/')

  // Seasons now lives inside the Grove hub.
  await page.getByRole('button', { name: 'Open the grove', exact: true }).click()
  await page.getByRole('button', { name: /open sanctuary seasons/i }).click()

  const dialog = page.getByRole('dialog', { name: /sanctuary seasons/i })
  await expect(dialog).toBeVisible()

  await page.screenshot({
    path: `playwright-report/seasons-${testInfo.project.name}.png`,
    fullPage: true,
  })
  const autumn = dialog.getByRole('listitem').filter({ hasText: 'Autumn' })
  await expect(autumn).toContainText(/Now/)

  expect(errors).toEqual([])
})
