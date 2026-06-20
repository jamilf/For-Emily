// Sync engine — moves the meaningful emily.* progress between localStorage and
// the per-user `progress` row in Supabase, using per-key last-write-wins so two
// devices editing different things never clobber each other.

import { writeAndBroadcast } from '../hooks/useLocalStorage.js'

// Only real progress syncs. Device-local prefs / caches stay put:
//   emily.mixer (per-device audio), emily.zen (UI), emily.verses (re-fetchable
//   cache), emily.spr (ephemeral seen-bag), emily.schemaVersion.
export const SYNC_KEYS = [
  'emily.flashcards',
  'emily.flashcardStats',
  'emily.stats',
  'emily.reflections',
  'emily.garden',
  'emily.meter',
  'emily.brainDump',
  'emily.keepsakes',
  'emily.grove', // unlocked varietals (sticky) follow Emily across devices
  'emily.focusLog', // Firefly Calendar time-series (real progress; per-key LWW)
  'emily.spirits', // Forest Spirits — sticky collectible companions
]
const SYNC_SET = new Set(SYNC_KEYS)
const META_KEY = 'emily.sync.meta' // { [key]: epochMs of last local change }

// Keys currently being written by an incoming pull — so the change listener in
// SyncProvider can ignore them and not echo a pull straight back as a push.
const suppressed = new Set()
export function isSuppressed(key) {
  return suppressed.has(key)
}
export function isSyncKey(key) {
  return SYNC_SET.has(key)
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function getMeta() {
  return readJSON(META_KEY, {}) || {}
}
function saveMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    /* ignore */
  }
}

/** Stamp a key as changed locally now (called when a synced key is written). */
export function stampKey(key, t = Date.now()) {
  const meta = getMeta()
  meta[key] = t
  saveMeta(meta)
  return meta
}

/** Current local values + change timestamps for the synced keys. */
export function snapshotLocal() {
  const meta = getMeta()
  const values = {}
  for (const k of SYNC_KEYS) {
    const v = readJSON(k, undefined)
    if (v !== undefined) values[k] = v
  }
  return { values, meta }
}

/**
 * Per-key last-write-wins merge of local and remote snapshots.
 * Returns the merged snapshot plus the list of keys whose REMOTE value should be
 * applied locally (because remote is newer, or local doesn't have it yet).
 */
export function merge(local, remote) {
  const rv = (remote && remote.values) || {}
  const rm = (remote && remote.meta) || {}
  const merged = { values: { ...local.values }, meta: { ...local.meta } }
  const applied = []
  for (const k of SYNC_KEYS) {
    const lt = local.meta[k] || 0
    const rt = rm[k] || 0
    const hasRemote = k in rv
    const hasLocal = k in local.values
    if (hasRemote && (rt > lt || !hasLocal)) {
      merged.values[k] = rv[k]
      merged.meta[k] = rt || Date.now()
      applied.push(k)
    }
  }
  return { merged, applied }
}

/** Write remote-won values into localStorage + live state, without echoing. */
function applyRemote(applied, values, meta) {
  for (const k of applied) {
    suppressed.add(k)
    writeAndBroadcast(k, values[k])
  }
  saveMeta(meta)
  // Release suppression after the dispatched events have been handled.
  setTimeout(() => {
    for (const k of applied) suppressed.delete(k)
  }, 0)
}

/** Pull the remote row, merge into local, and apply anything remote-newer. */
export async function pull(client, userId) {
  const { data, error } = await client.from('progress').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  const remote = data?.data || { values: {}, meta: {} }
  const local = snapshotLocal()
  const { merged, applied } = merge(local, remote)
  if (applied.length > 0) applyRemote(applied, merged.values, merged.meta)
  else saveMeta(merged.meta)
  return { merged, applied }
}

/** Upsert the (merged) local snapshot to the remote row. */
export async function push(client, userId, snapshot) {
  const snap = snapshot || snapshotLocal()
  const { error } = await client
    .from('progress')
    .upsert({ user_id: userId, data: { values: snap.values, meta: snap.meta } }, { onConflict: 'user_id' })
  if (error) throw error
}

/** Full sync: pull (merge) then push the merged result so both sides converge. */
export async function syncOnce(client, userId) {
  const { merged } = await pull(client, userId)
  await push(client, userId, merged)
  return Date.now()
}
