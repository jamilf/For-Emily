import { test, expect } from '@playwright/test'

// Sanctuary Seasons journey + screenshots (desktop + mobile). Runs in CI. Seeds the
// garden past the Autumn threshold so the world has clearly shifted.

test('Sanctuary Seasons: the header shows the season and the guide opens', async ({
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

  // The header season label reads the derived season by NAME.
  const seasonBtn = page.getByRole('button', { name: /your sanctuary is in Autumn/i })
  await expect(seasonBtn).toBeVisible()

  await page.screenshot({
    path: `playwright-report/seasons-${testInfo.project.name}.png`,
    fullPage: true,
  })

  await seasonBtn.click()
  const dialog = page.getByRole('dialog', { name: /sanctuary seasons/i })
  await expect(dialog).toBeVisible()
  const autumn = dialog.getByRole('listitem').filter({ hasText: 'Autumn' })
  await expect(autumn).toContainText(/Now/)

  expect(errors).toEqual([])
})
