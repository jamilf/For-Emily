// Scripture sourcing — fetched at runtime and cached to localStorage (emily.verses)
// so the app works offline afterward. We never hardcode copyrighted translations
// (e.g. NIV) from memory.
//
// Two providers, chosen by a single config switch (env-driven, safe defaults):
//   • 'web' (default)  World English Bible — public domain, no key, via bible-api.com.
//   • a licensed code  e.g. 'niv' — fetched from API.Bible (scripture.api.bible),
//                      which REQUIRES a key (VITE_BIBLE_API_KEY) and shows the
//                      publisher's required attribution. Without a key we stay on WEB.
//
// Any failure (offline, blocked, rate-limited, missing key) simply leaves a verse
// uncached, and the sprite-letter picker falls back to original encouragements.

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

export const TRANSLATION = (env.VITE_BIBLE_TRANSLATION || 'web').toLowerCase()
const API_KEY = env.VITE_BIBLE_API_KEY || ''
// API.Bible id for the licensed translation (defaults to their NIV id; override
// with VITE_BIBLE_ID for a different licensed text).
const BIBLE_ID = env.VITE_BIBLE_ID || '71c6eab17ae5b667-01'

// Use the licensed provider only when a non-WEB translation AND a key are set.
const USE_API_BIBLE = TRANSLATION !== 'web' && !!API_KEY

export const ATTRIBUTION = USE_API_BIBLE
  ? `Scripture quotations marked ${TRANSLATION.toUpperCase()}, via API.Bible (used by permission).`
  : 'World English Bible (public domain)'

// ── Provider request/response adapters ───────────────────────────────────────
function webRequest(ref) {
  return { url: `https://bible-api.com/${encodeURIComponent(ref)}?translation=web`, options: undefined }
}
function webParse(json) {
  return (json && (json.text || (json.verses || []).map((v) => v.text).join(' '))) || ''
}

function apiBibleRequest(ref) {
  return {
    url: `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(ref)}&limit=1`,
    options: { headers: { 'api-key': API_KEY } },
  }
}
function apiBibleParse(json) {
  // API.Bible returns HTML content; strip tags (we render as text, never HTML).
  const html = json?.data?.passages?.[0]?.content || ''
  return html.replace(/<[^>]+>/g, ' ')
}

const provider = USE_API_BIBLE
  ? { request: apiBibleRequest, parse: apiBibleParse }
  : { request: webRequest, parse: webParse }

/** Collapse a provider's verse text into a single clean string. */
function cleanText(raw) {
  return (raw || '').replace(/\s+/g, ' ').trim()
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
      const { url, options } = provider.request(ref)
      const res = await fetch(url, options)
      if (!res.ok) continue
      const text = cleanText(provider.parse(await res.json()))
      if (text) next[ref] = text
    } catch {
      /* offline / blocked / rate-limited — skip; we fall back to originals */
    }
  }
  return next
}
