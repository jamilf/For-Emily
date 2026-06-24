import { test, expect } from '@playwright/test'

// Visual record of the cozy 16-bit JRPG theme. Runs under both the desktop and
// mobile projects (so each shot is captured at both widths) and attaches the PNGs
// to the HTML report, which CI uploads as an artifact. These are not pixel-diff
// assertions (no brittle baselines); they exist so the look can be reviewed, with a
// light correctness check that each surface actually opened.

async function shoot(page, testInfo, name) {
  const png = await page.screenshot()
  await testInfo.attach(`${testInfo.project.name}-${name}`, { body: png, contentType: 'image/png' })
}

test('JRPG surfaces render at this viewport', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.waitForTimeout(400)

  // The dashboard: every WindowFrame card now wears the JRPG nameplate + bevel.
  await shoot(page, testInfo, 'dashboard')

  // The Grove hub: a GameWindow modal holding a MenuList with the focus cursor.
  await page.getByRole('button', { name: 'Open the grove', exact: true }).click()
  const grove = page.getByRole('dialog', { name: /the grove/i })
  await expect(grove).toBeVisible()
  await shoot(page, testInfo, 'grove-hub')
  await page.keyboard.press('Escape')

  // Sound & Music: a GameWindow panel (Drawer chrome).
  await page
    .getByRole('button', { name: /sound & music/i })
    .first()
    .click()
  await expect(page.getByRole('dialog', { name: /sound & music/i })).toBeVisible()
  await shoot(page, testInfo, 'sound-music')

  // Appearance settings live in the guide.
  await page
    .getByRole('button', { name: /how to use this app|guide/i })
    .first()
    .click()
  const guide = page.getByRole('dialog', { name: /how to use this app/i })
  await expect(guide).toBeVisible()
  await expect(guide.getByRole('combobox', { name: /effects intensity/i })).toBeVisible()
  await shoot(page, testInfo, 'appearance-settings')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the dashboard renders with effects calmed to instant', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.waitForTimeout(300)
    await expect(page.getByRole('main')).toBeVisible()
    await shoot(page, testInfo, 'dashboard-reduced-motion')
  })
})
