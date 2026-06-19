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
      detectSessionInUrl: false, // we use email one-time codes, not redirects
      storageKey: 'emily.auth',
    },
  })
  return _client
}
