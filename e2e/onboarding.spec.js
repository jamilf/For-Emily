import { test, expect } from '@playwright/test'

// First-run companion onboarding (UI + persistence only). Reduced motion makes the
// dialogue typewriter instant, so the "continue" affordance advances in one click.
test.use({ reducedMotion: 'reduce' })

test('first run shows the intro once, persists choices, then never returns', async ({ page }) => {
  await page.goto('/')

  const intro = page.getByRole('dialog', { name: /welcome/i })
  await expect(intro).toBeVisible()

  // Two greeting beats.
  await intro.getByRole('button', { name: /^continue$/i }).click()
  await intro.getByRole('button', { name: /^continue$/i }).click()

  // Pick a daily goal, then name the companion.
  await intro.getByRole('button', { name: /a solid day/i }).click()
  await intro.getByLabel(/a name for the sprite/i).fill('Pip')
  await intro.getByRole('button', { name: /^save$/i }).click()

  // Finish.
  await intro.getByRole('button', { name: /let us begin/i }).click()
  await expect(intro).toBeHidden()

  // Choices persisted.
  const stored = await page.evaluate(() => ({
    ui: JSON.parse(localStorage.getItem('emily.ui') || '{}'),
    meter: JSON.parse(localStorage.getItem('emily.meter') || '{}'),
    story: JSON.parse(localStorage.getItem('emily.story') || '{}'),
  }))
  expect(stored.ui.onboarded).toBe(true)
  expect(stored.meter.dailyGoalMin).toBe(60)
  expect(stored.story.companionName).toBe('Pip')

  // Reload: the intro never shows again, and the dashboard is interactive.
  await page.reload()
  await expect(page.getByRole('dialog', { name: /welcome/i })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
})

test('the intro is fully skippable in one tap', async ({ page }) => {
  await page.goto('/')
  const intro = page.getByRole('dialog', { name: /welcome/i })
  await expect(intro).toBeVisible()
  await page.getByRole('button', { name: /skip intro/i }).click()
  await expect(intro).toBeHidden()
  const onboarded = await page.evaluate(() => JSON.parse(localStorage.getItem('emily.ui') || '{}').onboarded)
  expect(onboarded).toBe(true)
})
