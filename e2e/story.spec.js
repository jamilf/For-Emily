import { test, expect } from '@playwright/test'

// Grove Story journey (desktop + mobile), run in CI where browsers are installed.
// Simulates a return after a multi-day gap: a welcome-back moment blooms, then a
// chapter reveal, then the Story modal. A reload proves the comeback is shown only
// once and the chapter stays acknowledged.

test('a return after a gap blooms a welcome-back, reveals a chapter, and opens the story', async ({
  page,
}, testInfo) => {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|service worker|manifest|React DevTools/i.test(m.text())) {
      errors.push(m.text())
    }
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  // Seed ONCE (a sentinel survives reloads) so the second load preserves the
  // dismissed/acked state instead of re-seeding the gap.
  await page.addInitScript(() => {
    if (localStorage.getItem('__storySeeded')) return
    localStorage.clear()
    const DAY = 24 * 60 * 60 * 1000
    // 10 finished sessions → through "Lanternlight"; last seen 5 days ago.
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
    )
    localStorage.setItem(
      'emily.story',
      JSON.stringify({ lastSeen: Date.now() - 5 * DAY, seenBeats: {}, ackChapters: {}, comebackShown: {} }),
    )
    localStorage.setItem('__storySeeded', '1')
  })
  await page.goto('/')

  // 1) The welcome-back moment blooms (a gift, never a guilt message).
  const welcome = page.getByRole('dialog', { name: /welcome back/i })
  await expect(welcome).toBeVisible()
  await expect(welcome.getByText(/nothing here goes anywhere when you rest/i)).toBeVisible()
  // Scope to the dialog: the dashboard behind it shows a "day streak" tile, which is
  // unrelated to the comeback copy we're guarding here.
  await expect(welcome.getByText(/lost|streak|behind|missed/i)).toHaveCount(0)

  await page.screenshot({
    path: `playwright-report/story-comeback-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await welcome.getByRole('button', { name: /close welcome back/i }).click()
  await expect(welcome).toBeHidden()

  // 2) A gentle chapter reveal follows; "Read it" opens the Story.
  const reveal = page.getByText(/a new chapter opened/i)
  await expect(reveal).toBeVisible()
  await page.getByRole('button', { name: /read it/i }).click()

  // 3) The Story modal lists the chapters reached, current marked by text.
  const story = page.getByRole('dialog', { name: /grove story/i })
  await expect(story).toBeVisible()
  await expect(story.getByText('Lanternlight')).toBeVisible()
  await expect(story.getByText(/you are here/i)).toBeVisible()
  await expect(story.getByText(/something new is waiting up ahead/i)).toBeVisible()
  await page.screenshot({
    path: `playwright-report/story-modal-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await story.getByRole('button', { name: /close story/i }).click()

  // 4) Reload: the comeback is not shown again, and a warm greeting appears.
  await page.reload()
  await expect(page.getByRole('dialog', { name: /welcome back/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /dismiss greeting/i })).toBeVisible()

  expect(errors).toEqual([])
})
