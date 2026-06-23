import { test, expect } from '@playwright/test'

// Constellations journey + screenshots (desktop + mobile). Runs in CI. Seeds a few
// sessions so at least one constellation has formed.

test('Constellations opens from the Grove hub, shows the sky + list, and screenshots', async ({
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
    const now = Date.now()
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 12 }, (_, i) => ({ id: i, ts: now - i * 3600000 }))),
    )
  })
  await page.goto('/')

  await page.getByRole('button', { name: 'Open the grove', exact: true }).click()
  await page.getByRole('button', { name: /open constellations/i }).click()
  const dialog = page.getByRole('dialog', { name: /your constellations/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/of 9 constellations formed/i)).toBeVisible()

  // The Lantern (>= 10 sessions) is formed with 12 seeded sessions. Scope to the
  // list item (the decorative sky also renders a "The Lantern" text label).
  const lantern = dialog.getByRole('listitem').filter({ hasText: 'The Lantern' })
  await expect(lantern).toContainText(/Formed/i)

  await page.screenshot({
    path: `playwright-report/constellations-${testInfo.project.name}.png`,
    fullPage: true,
  })

  expect(errors).toEqual([])
})
