import { test, expect } from '@playwright/test'

// Journal journey + screenshots (desktop + mobile). Runs in CI. Seeds a memory and
// a couple of spirit discoveries so the timeline has something to show.

test('Journal opens from the toolbar, shows a timeline, and screenshots', async ({ page }, testInfo) => {
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
      'emily.memories',
      JSON.stringify([
        { id: 1, dna: 0, ts: now - 86400000, title: 'Finished my assignment', note: 'felt great' },
      ]),
    )
    localStorage.setItem(
      'emily.spirits',
      JSON.stringify({
        unlocked: { curiosity: true },
        seen: {},
        discoveredAt: { curiosity: now - 2 * 86400000 },
      }),
    )
  })
  await page.goto('/')

  await page.getByRole('button', { name: /open your journal/i }).click()
  const dialog = page.getByRole('dialog', { name: /your journal/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Finished my assignment')).toBeVisible()

  // Search narrows the timeline.
  await dialog.getByRole('textbox', { name: /search your journal/i }).fill('assignment')
  await expect(dialog.getByText('Finished my assignment')).toBeVisible()

  await page.screenshot({
    path: `playwright-report/journal-${testInfo.project.name}.png`,
    fullPage: true,
  })

  expect(errors).toEqual([])
})
