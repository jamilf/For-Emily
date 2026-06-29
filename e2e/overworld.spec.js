import { test, expect } from '@playwright/test'

// The overworld companion NPC (UI only). Reduced motion makes the dialogue instant.
// Seed onboarded so the first-run intro is out of the way.
test.use({ reducedMotion: 'reduce' })
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('emily.ui', JSON.stringify({ onboarded: true })))
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
