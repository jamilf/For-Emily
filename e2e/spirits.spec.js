import { test, expect } from '@playwright/test'

// Forest Spirits journey + screenshots (desktop + mobile). Runs in CI, where
// browsers are installed. Seeds metrics so a couple of spirits are already found.

test('Forest Spirits opens from the garden, shows found + locked, and screenshots', async ({
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
    // 7-day streak earns Persistence; one session earns Curiosity.
    localStorage.setItem('emily.stats', JSON.stringify({ streak: 7 }))
    localStorage.setItem('emily.garden', JSON.stringify([{ id: 0, ts: Date.now() }]))
  })
  await page.goto('/')

  await page.getByRole('button', { name: /forest spirits/i }).click()
  const dialog = page.getByRole('dialog', { name: /forest spirits/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/of 6 spirits/i)).toBeVisible()

  // A locked spirit shows a hint + progress (state never by colour alone).
  await expect(dialog.getByRole('button', { name: /Dawn, locked/i })).toBeVisible()

  await page.screenshot({
    path: `playwright-report/spirits-${testInfo.project.name}.png`,
    fullPage: true,
  })

  // Open a locked spirit's detail.
  await dialog.getByRole('button', { name: /Dawn, locked/i }).click()
  await expect(dialog.getByRole('button', { name: /back to the spirits/i })).toBeVisible()

  expect(errors).toEqual([])
})
