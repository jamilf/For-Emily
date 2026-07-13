import { describe, it, expect } from 'vitest'
import { authRedirectUrl } from './config.js'

// The emailed sign-in link must land on THIS app, including the deploy base
// path: on GitHub Pages the app lives under /For-Emily/, and a bare origin
// would 404. Root deploys (Cloudflare, local dev) keep plain origin + '/'.
describe('authRedirectUrl', () => {
  it('keeps a root deploy at the origin root', () => {
    expect(authRedirectUrl('https://foremilytran.com', '/')).toBe('https://foremilytran.com/')
    expect(authRedirectUrl('http://localhost:5173', '/')).toBe('http://localhost:5173/')
  })

  it('includes the base path on a subpath deploy (GitHub Pages)', () => {
    expect(authRedirectUrl('https://jamilf.github.io', '/For-Emily/')).toBe(
      'https://jamilf.github.io/For-Emily/',
    )
  })

  it('returns undefined with no origin (SSR-safe)', () => {
    expect(authRedirectUrl('', '/')).toBeUndefined()
  })
})
