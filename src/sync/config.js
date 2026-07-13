// Supabase connection for cross-device progress sync.
//
// The publishable (anon) key is SAFE to ship in the client — it grants no
// special access on its own. Every row in the `progress` table is protected by
// Row Level Security (user_id = auth.uid()), so a user can only ever read or
// write their own data. Values can be overridden at build time via env vars
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) if you'd rather not commit them.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tbaiekqecfqdgeppxmst.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Fsaae7yQeknS_49JapsHDg_vU8H0oCd'

export const SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Where the sign-in email's link should land: this app, INCLUDING the deploy
 * base path. `window.location.origin` alone loses Vite's base, so on GitHub
 * Pages the link would land on the account root (a 404) instead of
 * /For-Emily/. Root deploys are unchanged (base '/'). The origin must also be
 * in the Supabase project's Auth URL allow-list for it to take effect.
 * @param {string} origin  e.g. https://jamilf.github.io
 * @param {string} base    Vite base path, e.g. '/' or '/For-Emily/'
 */
export function authRedirectUrl(
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  base = import.meta.env.BASE_URL || '/',
) {
  if (!origin) return undefined
  return new URL(base, origin).href
}

// Lazily create a single Supabase client. Imported dynamically so the SDK stays
// out of the initial bundle and only loads when sync is actually used.
let _client = null
export async function getClient() {
  if (_client) return _client
  if (!SYNC_ENABLED) return null
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Primary flow is a typed 6-digit code (verifyOtp). We also detect auth
      // params in the URL so that if the emailed link is clicked instead, it
      // completes sign-in on arrival (it lands on this app's origin, never the
      // Supabase default localhost:3000 — see emailRedirectTo in SyncProvider).
      detectSessionInUrl: true,
      storageKey: 'emily.auth',
    },
  })
  return _client
}
