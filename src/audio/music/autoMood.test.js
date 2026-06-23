import { describe, it, expect } from 'vitest'
import { pickAutoMood, AUTO_MOOD_IDS } from './autoMood.js'
import { STYLES } from './styles.js'

describe('pickAutoMood — deterministic context → mood', () => {
  it('always returns one of the known chiptune mood ids', () => {
    for (let hour = 0; hour < 24; hour++) {
      for (const rainLevel of [0, 0.3, 0.5, 1]) {
        for (const focusActive of [false, true]) {
          const id = pickAutoMood({ hour, rainLevel, focusActive })
          expect(AUTO_MOOD_IDS).toContain(id)
          expect(STYLES[id]).toBeTruthy() // resolves to a real preset
          expect(STYLES[id].group).toBe('chiptune')
        }
      }
    }
  })

  it('meaningful rain wins over everything → Rainy Focus', () => {
    expect(pickAutoMood({ hour: 2, rainLevel: 0.6, focusActive: true })).toBe('rainyfocus')
    expect(pickAutoMood({ hour: 14, rainLevel: 0.35 })).toBe('rainyfocus')
  })

  it('a touch of rain below the threshold does not trigger Rainy Focus', () => {
    expect(pickAutoMood({ hour: 14, rainLevel: 0.2 })).not.toBe('rainyfocus')
  })

  it('the small hours wind down', () => {
    expect(pickAutoMood({ hour: 2 })).toBe('winddown')
    expect(pickAutoMood({ hour: 4 })).toBe('winddown')
  })

  it('late evening is the late-night library', () => {
    expect(pickAutoMood({ hour: 22 })).toBe('latenight')
    expect(pickAutoMood({ hour: 21 })).toBe('latenight')
  })

  it('an active focus session stays calm in daytime', () => {
    expect(pickAutoMood({ hour: 14, focusActive: true })).toBe('latenight')
  })

  it('plain daytime keeps a gentle momentum', () => {
    expect(pickAutoMood({ hour: 14 })).toBe('momentum')
    expect(pickAutoMood({ hour: 10 })).toBe('momentum')
  })

  it('is deterministic and tolerates odd/empty input', () => {
    expect(pickAutoMood({ hour: 14 })).toBe(pickAutoMood({ hour: 14 }))
    expect(AUTO_MOOD_IDS).toContain(pickAutoMood())
    expect(AUTO_MOOD_IDS).toContain(pickAutoMood({ hour: 26 })) // wraps
    expect(AUTO_MOOD_IDS).toContain(pickAutoMood({ hour: -1 })) // wraps
  })
})
