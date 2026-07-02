import { describe, it, expect } from 'vitest'
import { companionLine } from './companionLine.js'

describe('companionLine — priority', () => {
  it('mentions a waiting letter first, above everything else', () => {
    const line = companionLine({ hasMail: true, dueCount: 5, running: true, streak: 9 })
    expect(line).toMatch(/letter/i)
  })

  it('stays quiet during a focus run (when there is no mail)', () => {
    expect(companionLine({ running: true, dueCount: 3 })).toMatch(/keep the grove quiet/i)
  })

  it('offers due cards with a count, gently', () => {
    expect(companionLine({ dueCount: 1 })).toMatch(/1 card /)
    expect(companionLine({ dueCount: 4 })).toMatch(/4 cards /)
  })
})

describe('companionLine — noticing real state', () => {
  it('celebrates a streak of 3 or more, by name', () => {
    const line = companionLine({ companionName: 'Pip', streak: 5 })
    expect(line).toMatch(/5 days in a row/i)
    expect(line).toMatch(/Pip/)
  })

  it('notices an upward week before a streak below the milestone', () => {
    expect(companionLine({ streak: 2, weekTrend: 'up' })).toMatch(/more little trees than last/i)
  })

  it('acknowledges a heavy last session warmly (above a down week)', () => {
    expect(companionLine({ weekTrend: 'down', lastMood: 'rain' })).toMatch(/came back anyway/i)
  })

  it('frames a quieter week as rest, never failure', () => {
    expect(companionLine({ weekTrend: 'down' })).toMatch(/resting is part of the rhythm/i)
  })

  it('carries a bright last session forward', () => {
    expect(companionLine({ lastMood: 'sun' })).toMatch(/carries a little of that/i)
  })
})

describe('companionLine — calm idle', () => {
  it('greets by part of day when nothing is notable', () => {
    expect(companionLine({ partOfDay: 'night', seed: 0 })).toMatch(/late, and the grove is hushed/i)
    expect(companionLine({ partOfDay: 'dawn', seed: 0 })).toMatch(/just waking up/i)
  })

  it('varies the idle line deterministically by seed', () => {
    const a = companionLine({ seed: 1 })
    const b = companionLine({ seed: 2 })
    const a2 = companionLine({ seed: 1 })
    expect(a).toBe(a2)
    expect(a).not.toBe(b)
  })

  it('weaves the companion name into idle lines', () => {
    expect(companionLine({ companionName: 'Pip', seed: 1 })).toMatch(/Pip/)
  })
})

describe('companionLine — welcome back', () => {
  it('takes priority over everything else, including a waiting letter', () => {
    const line = companionLine({ welcomeBack: true, hasMail: true, dueCount: 5, running: true })
    expect(line).toMatch(/there you are|welcome back|you are here/i)
  })

  it('weaves the companion name in and never mentions how long she was away', () => {
    const line = companionLine({ welcomeBack: true, companionName: 'Pip' })
    expect(line).toMatch(/Pip/)
    expect(line).not.toMatch(/minute|hour|while|long|away|gone|absen/i)
  })

  it('varies deterministically by seed', () => {
    const a = companionLine({ welcomeBack: true, seed: 0 })
    const b = companionLine({ welcomeBack: true, seed: 1 })
    expect(a).toBe(companionLine({ welcomeBack: true, seed: 0 }))
    expect(a).not.toBe(b)
  })
})

describe('companionLine — copy guard', () => {
  it('never emits an em-dash in any branch', () => {
    const samples = [
      companionLine({ hasMail: true }),
      companionLine({ running: true }),
      companionLine({ dueCount: 2 }),
      companionLine({ streak: 4, companionName: 'Pip' }),
      companionLine({ weekTrend: 'up' }),
      companionLine({ weekTrend: 'down' }),
      companionLine({ lastMood: 'rain' }),
      companionLine({ lastMood: 'sun' }),
      ...[0, 1, 2, 3].map((seed) => companionLine({ seed, partOfDay: 'dusk' })),
      ...[0, 1, 2].map((seed) => companionLine({ welcomeBack: true, seed, companionName: 'Pip' })),
    ]
    for (const s of samples) expect(s).not.toContain('—')
  })
})
