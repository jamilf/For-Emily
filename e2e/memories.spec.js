import { test, expect } from '@playwright/test'

// Memory Grove journey + screenshots (desktop + mobile). Runs in CI, where
// browsers are installed. Seeds a couple of harvested trees to dedicate.

test('Memory Grove opens from the garden, dedicates a tree, and screenshots', async ({
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
    localStorage.setItem(
      'emily.garden',
      JSON.stringify([
        { id: 0, ts: Date.now() - 86400000 },
        { id: 1, ts: Date.now() },
      ]),
    )
  })
  await page.goto('/')

  await page.getByRole('button', { name: /memory grove/i }).click()
  const dialog = page.getByRole('dialog', { name: /memory grove/i })
  await expect(dialog).toBeVisible()

  // Dedicate a tree: pick → form → save.
  await dialog.getByRole('button', { name: /dedicate a tree/i }).click()
  await dialog.getByRole('button', { name: /dedicate the/i }).first().click()
  await dialog.getByLabel('Title').fill('Finished my assignment')
  await dialog.getByRole('button', { name: /dedicate this tree/i }).click()

  // Back on the list: the count proves the save (unambiguous), then the card
  // itself. Use exact text so we don't also match the sr-only aria-live status
  // paragraph ("Memory "Finished my assignment" dedicated.").
  await expect(dialog.getByText(/1 memory kept/i)).toBeVisible()
  await expect(dialog.getByText('Finished my assignment', { exact: true })).toBeVisible()

  // Search narrows the list.
  await dialog.getByRole('textbox', { name: /search memories/i }).fill('assignment')
  await expect(dialog.getByText('Finished my assignment', { exact: true })).toBeVisible()

  await page.screenshot({
    path: `playwright-report/memories-${testInfo.project.name}.png`,
    fullPage: true,
  })

  expect(errors).toEqual([])
})
