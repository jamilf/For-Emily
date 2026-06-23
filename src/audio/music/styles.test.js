import { describe, it, expect } from 'vitest'
import { STYLES, MUSIC_STYLES, OFF, getStyle, labelFor } from './styles.js'
import { SCALES } from './theory.js'

describe('STYLES presets — well-formed and internally consistent', () => {
  const ids = Object.keys(STYLES)

  it('every preset declares a known mode and a non-empty progression', () => {
    for (const id of ids) {
      const s = STYLES[id]
      expect(s.id).toBe(id)
      expect(SCALES[s.mode], `${id}: unknown mode ${s.mode}`).toBeTruthy()
      expect(s.progression.length).toBeGreaterThan(0)
      expect(s.bpm).toBeGreaterThan(0)
      expect(s.beatsPerBar).toBeGreaterThan(0)
    }
  })

  it('the four chiptune moods are grouped and carry an FX send', () => {
    const chip = ids.filter((id) => STYLES[id].group === 'chiptune')
    expect(chip.sort()).toEqual(['latenight', 'momentum', 'rainyfocus', 'winddown'])
    for (const id of chip) {
      expect(STYLES[id].fx).toBeGreaterThan(0)
      // chip moods voice from the chiptune channels
      const voices = Object.values(STYLES[id].voices)
      for (const v of voices) expect(['pulse12', 'pulse25', 'pulse50', 'tri']).toContain(v)
    }
  })
})

describe('MUSIC_STYLES picker options', () => {
  it('lead with Off then Auto, and all ids are unique', () => {
    expect(MUSIC_STYLES[0].id).toBe(OFF)
    expect(MUSIC_STYLES[1].id).toBe('auto')
    const seen = new Set(MUSIC_STYLES.map((s) => s.id))
    expect(seen.size).toBe(MUSIC_STYLES.length)
  })

  it('offers exactly the Instrumental and Chiptune groups', () => {
    const groups = new Set(MUSIC_STYLES.filter((s) => s.group).map((s) => s.group))
    expect([...groups].sort()).toEqual(['Chiptune', 'Instrumental'])
  })

  it('every grouped option resolves to a real preset', () => {
    for (const s of MUSIC_STYLES) {
      if (s.group) expect(STYLES[s.id]).toBeTruthy()
    }
  })
})

describe('getStyle / labelFor', () => {
  it('getStyle returns the preset for a real id and null otherwise', () => {
    expect(getStyle('latenight')).toBe(STYLES.latenight)
    expect(getStyle('off')).toBeNull()
    expect(getStyle('auto')).toBeNull()
    expect(getStyle('nope')).toBeNull()
  })

  it('labelFor gives a friendly label, falling back to Off', () => {
    expect(labelFor('off')).toBe('Off')
    expect(labelFor('auto')).toBe('Auto')
    expect(labelFor('latenight')).toBe('Late-night Library')
    expect(labelFor('unknown')).toBe('Off')
  })
})
