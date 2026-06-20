import { test, expect } from '@playwright/test'

// Grove Almanac journey + before/after-style screenshots (desktop + mobile).
// Runs in CI (browsers installed there).

test('Grove Almanac opens, shows locked silhouettes, and screenshots', async ({ page }, testInfo) => {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|service worker|manifest|React DevTools/i.test(m.text())) {
      errors.push(m.text())
    }
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')

  // Screenshot the dashboard (the garden side rail) first.
  await page.screenshot({ path: `playwright-report/dashboard-${testInfo.project.name}.png`, fullPage: true })

  await page.getByRole('button', { name: /open the grove almanac/i }).click()
  const dialog = page.getByRole('dialog', { name: /grove almanac/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/you've grown \d+ of \d+/i)).toBeVisible()

  // A fresh grove is all-locked: a known varietal shows a locked card with progress.
  await expect(dialog.getByRole('button', { name: /First Sprout, locked/i })).toBeVisible()

  await page.screenshot({ path: `playwright-report/grove-${testInfo.project.name}.png`, fullPage: true })

  // Filter to Locked, then open a detail view.
  await dialog.getByRole('button', { name: 'locked' }).click()
  await dialog.getByRole('button', { name: /First Sprout, locked/i }).click()
  await expect(dialog.getByRole('button', { name: /back to the grove/i })).toBeVisible()

  expect(errors).toEqual([])
})
