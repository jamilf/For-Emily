// Scripture sourcing — fetched at runtime and cached to localStorage (emily.verses)
// so the app works offline afterward. We never hardcode copyrighted translations
// (e.g. NIV) from memory. Default is the public-domain World English Bible (WEB)
// via bible-api.com, which needs no API key. Swapping translations is a one-line
// change to TRANSLATION (and, for licensed text like NIV, supplying a key below).

// ── Config ───────────────────────────────────────────────────────────────────
// 'web' = World English Bible (public domain, no key). To use NIV you'd switch a
// provider to API.Bible (scripture.api.bible), supply a key, and show the
// license-required copyright notice — left inert here since no key is configured.
export const TRANSLATION = 'web'

export const ATTRIBUTION = TRANSLATION === 'web' ? 'World English Bible (public domain)' : ''

// bible-api.com returns WEB by default and accepts a ?translation= param.
function urlFor(ref) {
  return `https://bible-api.com/${encodeURIComponent(ref)}?translation=${TRANSLATION}`
}

// Collapse the API's verse text into a single clean string.
function cleanText(json) {
  const t = (json && (json.text || (json.verses || []).map((v) => v.text).join(' '))) || ''
  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Fill missing verse text for the given refs, writing into a plain { ref: text }
 * map. Returns a NEW map (caller persists it to emily.verses). Politely
 * sequential, fully guarded — a failed fetch just leaves that ref absent, and
 * callers fall back to original (non-scripture) encouragements.
 *
 * @param {string[]} refs       references to ensure are cached
 * @param {Record<string,string>} cache  existing { ref: text } cache
 * @param {number} limit        max network requests this call (keeps it gentle)
 */
export async function fetchVerses(refs, cache = {}, limit = 12) {
  const next = { ...cache }
  if (typeof fetch !== 'function') return next
  const missing = refs.filter((r) => !next[r]).slice(0, limit)
  for (const ref of missing) {
    try {
      const res = await fetch(urlFor(ref))
      if (!res.ok) continue
      const json = await res.json()
      const text = cleanText(json)
      if (text) next[ref] = text
    } catch {
      /* offline / blocked / rate-limited — skip; we fall back to originals */
    }
  }
  return next
}
