// StorageManager — a thin, versioned, safe wrapper around localStorage for the
// Phase-8 features. Existing widgets keep using usePersistedState directly; this
// adds a schema version + migration seam + defaults fallback for the new keys.
//
// It is intentionally tiny and dependency-free. All values live under the same
// `emily.*` namespace so they sync through the existing usePersistedState hook.

const VERSION_KEY = 'emily.schemaVersion'
export const SCHEMA_VERSION = 1

/** Default values for every new Phase-8 key (single source of truth). */
export const DEFAULTS = {
  'emily.mixer': {
    enabled: false,
    master: 0.7,
    levels: {
      steadyRain: 0.5,
      rainWindow: 0,
      thunder: 0,
      windTrees: 0,
      fireplace: 0,
      coffeeShop: 0,
      brownNoise: 0,
    },
  },
  'emily.garden': [], // [{ id: <DNA number>, ts }]
  'emily.brainDump': '',
  'emily.zen': false,
  'emily.meter': { dailyGoalMin: 100 },
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
 * Run once on app boot. Stamps the schema version and provides a seam for
 * future migrations. Today there is nothing to migrate (v1), but the structure
 * is here so later versions can transform old shapes safely.
 */
export function migrate() {
  let current = 0
  try {
    current = Number(localStorage.getItem(VERSION_KEY)) || 0
  } catch {
    /* ignore */
  }
  if (current === SCHEMA_VERSION) return

  // --- future migrations go here, e.g.:
  // if (current < 2) { ...transform... }

  try {
    localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION))
  } catch {
    /* ignore */
  }
}
