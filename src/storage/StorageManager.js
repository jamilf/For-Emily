// StorageManager — a thin, versioned, safe wrapper around localStorage for the
// Phase-8 features. Existing widgets keep using usePersistedState directly; this
// adds a schema version + migration seam + defaults fallback for the new keys.
//
// It is intentionally tiny and dependency-free. All values live under the same
// `emily.*` namespace so they sync through the existing usePersistedState hook.

import { writeAndBroadcast } from '../hooks/useLocalStorage.js'
import { groveMetrics, reconcile } from '../data/grove.js'
import { backfillFromGarden } from '../data/focusLog.js'
import { spiritMetrics, reconcileSpirits } from '../data/spirits.js'

const VERSION_KEY = 'emily.schemaVersion'
export const SCHEMA_VERSION = 9
const NS = 'emily.'
// Keys excluded from a portable backup: the auth session token (device/secret)
// and the internal sync bookkeeping (rebuilt automatically).
const BACKUP_EXCLUDE = new Set([VERSION_KEY, 'emily.auth', 'emily.sync.meta'])

/** Default values for every new Phase-8 key (single source of truth). */
export const DEFAULTS = {
  'emily.mixer': {
    enabled: false,
    master: 0.7,
    // Generative focus music (device-local; never autoplays). `musicStyle` is a
    // string: 'off', 'auto', an instrumental style, or a chiptune mood id.
    // `entrainment` is an opt-in, experimental amplitude-modulation toggle.
    musicStyle: 'off',
    musicVolume: 0.5,
    entrainment: false,
    levels: {
      steadyRain: 0.5,
      rainWindow: 0,
      thunder: 0,
      windTrees: 0,
      fireplace: 0,
    },
  },
  'emily.garden': [], // [{ id: <DNA number>, ts }]
  'emily.brainDump': '',
  'emily.zen': false,
  'emily.meter': { dailyGoalMin: 100 },
  // Phase-9: flashcard stats, sprite-letter state, kept letters, verse cache.
  'emily.flashcardStats': { day: '', reviewedToday: 0, streak: 0, lastReviewDay: null, correct: 0, total: 0 },
  'emily.spr': { seen: [], lastOpenDay: '' },
  'emily.flashSession': null, // in-progress review (device-local; resumed on reopen)
  // Device-local flashcard UI prefs (sticky study toggles; never affects scheduling).
  'emily.flashPrefs': { typed: false, lastSize: 10 },
  'emily.keepsakes': [], // [{ id, text, ref, type, signoff, ts }]
  'emily.verses': {}, // { [reference]: text } cached from the Bible API
  // Phase-10: Grove Almanac — sticky unlocked varietals + an optional queued seed.
  'emily.grove': { unlocked: {}, plantNext: null }, // { unlocked: { [id]: 'YYYY-MM-DD' }, plantNext }
  // Phase-11: Firefly Calendar — per-local-day focus time-series.
  'emily.focusLog': {}, // { 'YYYY-MM-DD': { sessions, minutes|null } }
  // Phase-12: Forest Spirits — sticky collectible companions.
  'emily.spirits': { unlocked: {}, seen: {}, discoveredAt: {} },
  // Phase-13: Memory Grove — dedicated trees with a title + note.
  'emily.memories': [], // [{ id, dna, ts, title, note }]
  // Phase-14: Grove Story — return continuity + reveal acks (chapter/greeting/
  // comeback are all DERIVED; only this small ack state + the companion's name are
  // stored). `companionName` is additive + default-backed, so no migration is needed.
  'emily.story': {
    lastSeen: 0,
    seenBeats: {},
    ackChapters: {},
    comebackShown: {},
    companionName: null,
    notes: {},
    letterAcks: {},
  },
  // Scene Themes — cosmetic skies unlocked as the grove grows. Additive +
  // default-backed (the default 'grove' theme is always on), so no migration.
  'emily.themes': { selected: null, unlocked: {} }, // unlocked: { [id]: 'YYYY-MM-DD' }
  // Chosen focus-session length in minutes (25 stays the default). Additive.
  'emily.timer': { focusMin: 25 },
}

/** Safe read with a defaults fallback; never throws. */
export function read(key, fallback) {
  const dflt = fallback !== undefined ? fallback : DEFAULTS[key]
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return dflt
    const parsed = JSON.parse(raw)
    // Shallow-merge object defaults so new sub-fields appear on old saves.
    if (dflt && typeof dflt === 'object' && !Array.isArray(dflt) && parsed && typeof parsed === 'object') {
      return { ...dflt, ...parsed, ...(dflt.levels ? { levels: { ...dflt.levels, ...parsed.levels } } : {}) }
    }
    return parsed
  } catch {
    return dflt
  }
}

/** Safe write; never throws on quota errors. */
export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/**
 * Run once on app boot. Applies any pending migrations in order, then stamps the
 * current schema version. Idempotent and non-destructive — re-running it never
 * changes data, and a failed/partial run leaves existing keys untouched.
 */
export function migrate() {
  let current = 0
  try {
    current = Number(localStorage.getItem(VERSION_KEY)) || 0
  } catch {
    current = 0
  }
  if (current === SCHEMA_VERSION) return

  // Ordered, additive migrations. Each step only transforms shapes; it never
  // deletes a key it doesn't understand, so unknown/newer data survives.
  try {
    // v0/v1 → v2: the Phase-9 keys are all defaults-backed via read(), so no
    // data transform is required.
    // v2 → v3: seed the Grove Almanac retroactively from existing stats so Emily
    // opens an already-populated collection (sticky unlocks; no data touched).
    if (current < 3) {
      const existing = read('emily.grove', { unlocked: {}, plantNext: null })
      const metrics = groveMetrics({
        garden: read('emily.garden', []),
        stats: read('emily.stats', {}),
        flashcardStats: read('emily.flashcardStats', {}),
        reflections: read('emily.reflections', []),
      })
      write('emily.grove', reconcile(existing, metrics).grove)
    }
    // v3 → v4: seed the Firefly Calendar retroactively so it opens populated on
    // day one. Backfill days from the garden, but never overwrite a day already
    // present in focusLog (live days carry real minutes) — only add absent days.
    if (current < 4) {
      const backfilled = backfillFromGarden(read('emily.garden', []))
      const existingLog = read('emily.focusLog', {})
      write('emily.focusLog', { ...backfilled, ...existingLog })
    }
    // v4 → v5: seed Forest Spirits retroactively from existing metrics (same sticky
    // reconcile engine as the Grove). Backfilled unlocks carry no discovery date
    // (null) so we never fabricate history. Additive: never re-locks or overwrites.
    if (current < 5) {
      const existing = read('emily.spirits', { unlocked: {}, seen: {}, discoveredAt: {} })
      const metrics = spiritMetrics({
        garden: read('emily.garden', []),
        stats: read('emily.stats', {}),
        flashcardStats: read('emily.flashcardStats', {}),
        reflections: read('emily.reflections', []),
      })
      write('emily.spirits', reconcileSpirits(existing, metrics, null).state)
    }
    // v5 → v6: Memory Grove is user-authored, so there is nothing to backfill —
    // just ensure the key exists. Non-destructive: never overwrites real memories.
    if (current < 6) {
      if (localStorage.getItem('emily.memories') == null) write('emily.memories', [])
    }
    // v6 → v7: Grove Story. Ensure the key exists. Seed `lastSeen` to NOW only for
    // a user who already has history, so upgrading never triggers a false "welcome
    // back" comeback; a brand-new install keeps lastSeen = 0 so the first open reads
    // as a first-day greeting (never a comeback). Non-destructive: never overwrites.
    if (current < 7) {
      if (localStorage.getItem('emily.story') == null) {
        const hasHistory = (read('emily.garden', []).length || 0) > 0
        write('emily.story', { ...DEFAULTS['emily.story'], lastSeen: hasHistory ? Date.now() : 0 })
      }
    }
    // v7 → v8: the mixer gained an `entrainment` toggle, and the Coffee Shop +
    // Brown Noise layers were retired. Default the new field and prune the two
    // removed layer keys, keeping every other saved value. Idempotent; only runs
    // when a saved mixer exists (a fresh install gets DEFAULTS via read()).
    if (current < 8) {
      const raw = localStorage.getItem('emily.mixer')
      if (raw != null) {
        const m = read('emily.mixer', DEFAULTS['emily.mixer'])
        const levels = { ...m.levels }
        delete levels.coffeeShop
        delete levels.brownNoise
        write('emily.mixer', { ...m, entrainment: m.entrainment ?? false, levels })
      }
    }
    // v8 → v9: flashcards gained an additive `type` field (basic|cloze) and a new
    // device-local `emily.flashPrefs`. Both self-heal via normalizeCard / read()'s
    // defaults back-fill, so there is no data transform — existing cards keep
    // working untouched and a double-run is a no-op. (Mirrors the v0→v2 no-op.)
    localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION))
  } catch {
    /* ignore quota/availability errors — app still works on current data */
  }
}

/** List every key currently stored under the `emily.*` namespace. */
function emilyKeys() {
  const keys = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(NS)) keys.push(k)
    }
  } catch {
    /* ignore */
  }
  return keys
}

/**
 * Serialize all of Emily's progress into a portable "Sanctuary backup" object.
 * Excludes the auth token and internal sync bookkeeping. Values are stored
 * pre-parsed so the file is human-readable JSON.
 * @returns {{app:string, schemaVersion:number, exportedAt:string, data:Object}}
 */
export function exportAll() {
  const data = {}
  for (const key of emilyKeys()) {
    if (BACKUP_EXCLUDE.has(key)) continue
    try {
      const raw = localStorage.getItem(key)
      data[key] = raw == null ? null : JSON.parse(raw)
    } catch {
      /* skip unreadable/corrupt key rather than abort the whole backup */
    }
  }
  return {
    app: 'emilys-study-sanctuary',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Validate a parsed backup object without mutating anything. Returns the keys
 * that would be restored, or throws a friendly Error describing what's wrong.
 * @param {unknown} payload
 * @returns {string[]} restorable emily.* keys
 */
export function validateBackup(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('That file is not a Sanctuary backup.')
  }
  const data = payload.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('This backup has no data to restore.')
  }
  const keys = Object.keys(data).filter((k) => k.startsWith(NS) && !BACKUP_EXCLUDE.has(k))
  if (keys.length === 0) throw new Error('This backup contains no Sanctuary data.')
  return keys
}

/**
 * Restore a parsed backup into localStorage, broadcasting each write so any
 * mounted screens update live. Validates first and only writes recognised
 * `emily.*` keys; the auth token and sync meta are ignored. Never partially
 * corrupts existing data — invalid input throws before any write.
 * @param {unknown} payload  parsed JSON from a backup file
 * @returns {number} number of keys restored
 */
export function importAll(payload) {
  const keys = validateBackup(payload)
  for (const key of keys) {
    writeAndBroadcast(key, payload.data[key])
  }
  return keys.length
}
