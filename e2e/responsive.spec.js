import { test, expect } from '@playwright/test'

// Responsive / mobile-scroll hardening proof. Runs on both the desktop and mobile
// (Pixel 5) projects. For each modal it asserts: opens, no horizontal page scroll,
// the background is scroll-locked (body pinned), an internal scroll region exists,
// and Esc closes + returns focus to the opener. Screenshots per modal per viewport.

// Each modal here has a STABLE opener (one that stays mounted while the modal is
// open), so the Esc-returns-focus check holds. The Grove hub stands in for the many
// world surfaces it launches — they all share this exact modal shell.
const MODALS = [
  { slug: 'grove', open: /^open the grove$/i, dialog: /the grove/i },
  { slug: 'quests', open: /open today's focus quests/i, dialog: /focus quests/i },
  { slug: 'spirits', open: /forest spirits/i, dialog: /forest spirits/i },
  { slug: 'memories', open: /memory grove/i, dialog: /memory grove/i },
]

async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, 'no horizontal page overflow').toBeLessThanOrEqual(1) // allow sub-pixel rounding
}

test('modals: scroll-locked, no horizontal overflow, keyboard-closable (per viewport)', async ({
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
    localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true }))
    // A few trees so the garden's collection buttons render and the page is tall.
    const now = Date.now()
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 6 }, (_, i) => ({ id: i, ts: now - i * 3600000 }))),
    )
  })
  await page.goto('/')

  // The dashboard itself must not scroll horizontally at this viewport.
  await noHorizontalOverflow(page)

  for (const m of MODALS) {
    const opener = page.getByRole('button', { name: m.open }).first()
    await opener.scrollIntoViewIfNeeded()
    await opener.click()

    const dialog = page.getByRole('dialog', { name: m.dialog })
    await expect(dialog).toBeVisible()

    // No horizontal page overflow with the modal open.
    await noHorizontalOverflow(page)

    // Background scroll is locked (body pinned) so the page can't scroll behind it.
    const bodyPos = await page.evaluate(() => getComputedStyle(document.body).position)
    expect(bodyPos, `${m.slug}: body scroll-locked`).toBe('fixed')

    // A scrollable internal region exists so tall content scrolls inside the modal.
    const hasInternalScroll = await dialog.evaluate((el) => !!el.querySelector('.overflow-y-auto'))
    expect(hasInternalScroll, `${m.slug}: internal scroll region`).toBe(true)

    // The close control is a comfortable tap target (>= 40px both ways). Measure the
    // layout box (offsetWidth/Height) rather than boundingBox so the panel's entrance
    // scale animation can't report a transient sub-40 size.
    const closeSize = await dialog
      .getByRole('button', { name: /^close/i })
      .first()
      .evaluate((el) => ({ w: el.offsetWidth, h: el.offsetHeight }))
    expect(closeSize.w, `${m.slug}: close tap-target width`).toBeGreaterThanOrEqual(40)
    expect(closeSize.h, `${m.slug}: close tap-target height`).toBeGreaterThanOrEqual(40)

    // The panel stays fully on-screen (max-h-full + safe-area overlay padding) so the
    // header/close and the bottom of the scroll area are never clipped off the viewport.
    const vh = page.viewportSize().height
    const panel = await dialog.boundingBox()
    expect(panel.y, `${m.slug}: panel top on-screen`).toBeGreaterThanOrEqual(-1)
    expect(panel.y + panel.height, `${m.slug}: panel bottom on-screen`).toBeLessThanOrEqual(vh + 1)

    await page.screenshot({
      path: `playwright-report/responsive-${m.slug}-${testInfo.project.name}.png`,
      fullPage: false,
    })

    // Esc closes and returns focus to the opener; the body lock is released.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
    const restored = await page.evaluate(() => getComputedStyle(document.body).position)
    expect(restored, `${m.slug}: body lock released`).not.toBe('fixed')
  }

  expect(errors).toEqual([])
})
