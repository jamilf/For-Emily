import { test, expect } from '@playwright/test'

// The overworld companion NPC (UI only). Seed onboarded so the first-run intro is
// out of the way, and `effects: 'minimal'` so the dialogue typewriter is instant
// (a crawling reveal grows the box and keeps the menu below it moving, which makes
// the action buttons fail Playwright's actionability/stability checks).
test.use({ reducedMotion: 'reduce' })
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true, effects: 'minimal' })),
  )
})

test('tapping the companion opens a talk panel that routes to the grove', async ({ page }) => {
  await page.goto('/')

  // The soot companion idles by the timer; tapping it opens the talk dialogue.
  // The sprite bobs (an infinite ambient animation), so a normal click can wait
  // forever on actionability stability; dispatch the event straight to it, as the
  // sanctuary journey does for the same sprite.
  await page.getByRole('button', { name: /talk to the sprite/i }).dispatchEvent('click')
  const talk = page.getByRole('dialog', { name: /talk to the sprite/i })
  await expect(talk).toBeVisible()

  // An action routes to a real surface (the Grove hub) and the panel closes.
  await talk.getByRole('button', { name: /wander the grove/i }).click()
  await expect(talk).toBeHidden()
  await expect(page.getByRole('dialog', { name: /the grove/i })).toBeVisible()
})
