import { test, expect } from '@playwright/test'

// The focus session grows this session's tree through its stages (UI only). Reduced
// motion + minimal effects keep it deterministic; the clock is driven so we can land
// on a couple of growth stages. The stage caption is a plain visible text node.
test.use({ reducedMotion: 'reduce' })
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true, effects: 'minimal' })),
  )
})

test('the session tree grows through its stages as time passes', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')

  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText('Seed planted.')).toBeVisible()

  // Past the sprout threshold (~0.30 of a 25 minute session).
  await page.clock.fastForward(9 * 60 * 1000)
  await expect(page.getByText('Sprouting.')).toBeVisible()

  // A full, mature tree before completion (~0.90), so finishing reads as a harvest.
  await page.clock.fastForward(14 * 60 * 1000)
  await expect(page.getByText('Grown. Into the garden it goes.')).toBeVisible()
})
