import { describe, it, expect, afterEach, vi } from 'vitest'
import { portalTarget } from './portalTarget.js'

afterEach(() => {
  vi.unstubAllGlobals()
  document.querySelectorAll('.app-root').forEach((el) => el.remove())
})

describe('portalTarget', () => {
  it('returns the .app-root element when one is in the DOM', () => {
    const root = document.createElement('div')
    root.className = 'app-root'
    document.body.appendChild(root)
    expect(portalTarget()).toBe(root)
  })

  it('falls back to document.body when there is no app root', () => {
    expect(portalTarget()).toBe(document.body)
  })

  it('returns null when there is no document (SSR guard)', () => {
    vi.stubGlobal('document', undefined)
    expect(portalTarget()).toBeNull()
  })
})
