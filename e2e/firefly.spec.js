import { test, expect } from '@playwright/test'

// Firefly Calendar journey + screenshots (desktop + mobile). Runs in CI, where
// browsers are installed. Seeds a few recent days so the meadow shows fireflies.

test('Firefly Calendar opens from the Focus Meter, selects a day, and screenshots', async ({
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
    const DAY = 86400000
    const now = Date.now()
    const ymd = (t) => {
      const d = new Date(t)
      const p = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    }
    const log = {}
    log[ymd(now)] = { sessions: 2, minutes: 50 }
    log[ymd(now - 2 * DAY)] = { sessions: 4, minutes: 100 }
    log[ymd(now - 5 * DAY)] = { sessions: 1, minutes: 25 }
    localStorage.setItem('emily.focusLog', JSON.stringify(log))
  })
  await page.goto('/')

  await page.getByRole('button', { name: /firefly calendar/i }).click()
  const dialog = page.getByRole('dialog', { name: /firefly calendar/i })
  await expect(dialog).toBeVisible()

  // The brightest seeded day reads its count + known minutes (never colour alone).
  const busy = dialog.getByRole('button', { name: /4 focus sessions, ~100 min/i })
  await expect(busy).toBeVisible()
  await busy.click()
  await expect(dialog.getByText(/4 fireflies lit/i)).toBeVisible()

  await page.screenshot({
    path: `playwright-report/firefly-${testInfo.project.name}.png`,
    fullPage: true,
  })

  // The meadow scrolls horizontally when it overflows (no data hidden).
  const scroller = dialog.locator('div.overflow-x-auto').first()
  const overflow = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth)
  if (testInfo.project.name === 'mobile') {
    expect(overflow).toBeGreaterThan(0)
    await scroller.evaluate((el) => {
      el.scrollLeft = el.scrollWidth
    })
    const scrolled = await scroller.evaluate((el) => el.scrollLeft)
    expect(scrolled).toBeGreaterThan(0)
  }

  expect(errors).toEqual([])
})
