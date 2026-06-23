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

  // The living background tags the root with the local time of day.
  await expect(page.locator('.app-root')).toHaveClass(/tod-(dawn|day|dusk|night)/)

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

  // The sprite's milestone letters are shelved here too (grown >= 5 earned one).
  await expect(story.getByRole('heading', { name: /letters from/i })).toBeVisible()
  await expect(story.getByText('Five little trees')).toBeVisible()

  // She co-authors the story: leave a keeper note on the current chapter.
  await story
    .getByRole('button', { name: /leave a note/i })
    .first()
    .click()
  await story.getByRole('textbox').first().fill('a quiet good day')
  await story.getByRole('button', { name: /^save$/i }).click()
  await expect(story.getByText('a quiet good day')).toBeVisible()

  await page.screenshot({
    path: `playwright-report/story-modal-${testInfo.project.name}.png`,
    fullPage: true,
  })
  await story.getByRole('button', { name: /close story/i }).click()

  // The note persists: reopen the Story from the Grove hub and it's still there.
  await page.getByRole('button', { name: /open the grove/i }).click()
  await page.getByRole('button', { name: /open grove story/i }).click()
  const story2 = page.getByRole('dialog', { name: /grove story/i })
  await expect(story2.getByText('a quiet good day')).toBeVisible()
  await story2.getByRole('button', { name: /close story/i }).click()

  // 4) Reload: the comeback is not shown again, and a warm greeting appears.
  await page.reload()
  await expect(page.getByRole('dialog', { name: /welcome back/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /dismiss greeting/i })).toBeVisible()

  expect(errors).toEqual([])
})

test('a milestone letter arrives as a gentle toast and opens to the letter shelf', async ({ page }) => {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|service worker|manifest|React DevTools/i.test(m.text())) {
      errors.push(m.text())
    }
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  // Seed a same-day visit (no comeback) with every reached chapter already acked,
  // so the only ambient announcement left is the earned-but-unseen milestone letter.
  await page.addInitScript(() => {
    if (localStorage.getItem('__letterSeeded')) return
    localStorage.clear()
    localStorage.setItem(
      'emily.garden',
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ id: 0, ts: Date.now() - i * 3600000 }))),
    )
    localStorage.setItem(
      'emily.story',
      JSON.stringify({
        lastSeen: Date.now(),
        seenBeats: {},
        ackChapters: { stirs: true, mossbright: true, keeper: true, lanternlight: true },
        comebackShown: {},
        letterAcks: {},
      }),
    )
    localStorage.setItem('__letterSeeded', '1')
  })
  await page.goto('/')

  // The letter toast announces itself without trapping focus.
  const toast = page.getByText(/a letter from/i)
  await expect(toast).toBeVisible()
  await expect(page.getByText('Five little trees')).toBeVisible()

  // "Read it" opens the Story to the letter shelf.
  await page.getByRole('button', { name: /read it/i }).click()
  const story = page.getByRole('dialog', { name: /grove story/i })
  await expect(story).toBeVisible()
  await expect(story.getByRole('heading', { name: /letters from/i })).toBeVisible()
  await expect(story.getByText(/all my love/i).first()).toBeVisible()
  await story.getByRole('button', { name: /close story/i }).click()

  // Reload: the letter was acknowledged, so its toast does not nag again.
  await page.reload()
  await expect(page.getByText(/a letter from/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /dismiss greeting/i })).toBeVisible()

  expect(errors).toEqual([])
})
