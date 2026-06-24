import { test, expect } from '@playwright/test'

// Focus Quest Board journey + screenshots (desktop + mobile). Runs in CI. Seeds a few
// of today's metrics so some quests read as done.

test('Focus Quests opens from the toolbar and shows the daily board', async ({ page }, testInfo) => {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|service worker|manifest|React DevTools/i.test(m.text())) {
      errors.push(m.text())
    }
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true }))
    const at = (h) => {
      const d = new Date()
      d.setHours(h, 0, 0, 0)
      return d.getTime()
    }
    localStorage.setItem(
      'emily.garden',
      JSON.stringify([
        { id: 0, ts: at(9) },
        { id: 1, ts: at(13) },
        { id: 2, ts: at(21) },
      ]),
    )
    localStorage.setItem('emily.reflections', JSON.stringify([{ ts: at(10), mood: 'sun', note: 'good' }]))
  })
  await page.goto('/')

  await page.getByRole('button', { name: /open today's focus quests/i }).click()
  const dialog = page.getByRole('dialog', { name: /focus quests/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/quests tended today/i)).toBeVisible()
  // No fail/expire framing anywhere.
  await expect(dialog.getByText(/nothing to fail/i)).toBeVisible()

  await page.screenshot({
    path: `playwright-report/quests-${testInfo.project.name}.png`,
    fullPage: true,
  })

  expect(errors).toEqual([])
})
