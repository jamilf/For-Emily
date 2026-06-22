// Grove Story — the narrative layer over the living world. PURE + deterministic:
// chapters are derived from milestones the app already stores (no new currency),
// sticky + retroactive exactly like the Grove Almanac (reusing grove.js's
// progressFor). Greetings and the comeback gift are seeded so tests are stable.
//
// Retention ethics are baked in by design: chapter gates use only MONOTONIC,
// cumulative metrics (trees grown), so a quiet week or a dropped streak can never
// roll the story backward. A gap only ever produces a positive, welcoming event.
// No streak-break, no loss, no FOMO, no daily-login pressure lives here.

import { progressFor, dnaOf, speciesForDna } from './grove.js'
import { SPIRITS_BY_ID } from './spirits.js'
import { localDayStr, startOfDay } from './scheduler.js'

const DAY = 24 * 60 * 60 * 1000

// ── Tunable flags (single source; shared by code + tests) ────────────────────
/** Local days away before a return blooms a welcome-back gift. Gentle on purpose. */
export const COMEBACK_GAP_DAYS = 3
/** Return-type buckets, by local-day gap since `lastSeen`. */
export const RETURN = {
  FIRST: 'first-day', // no prior visit recorded
  SAME: 'same-day', // returned within the same local day
  SHORT: 'short-gap', // 1..COMEBACK_GAP_DAYS-1 days
  LONG: 'long-gap', // >= COMEBACK_GAP_DAYS days
}

// ── Chapters ─────────────────────────────────────────────────────────────────
// A cozy, open-ended tending tale: the grove is slowly waking and Emily is its
// keeper. No villain, no fail state. Each chapter is gated on `grown` (one tree
// per finished focus session) with strictly increasing thresholds, so the spine
// is reachable by the core loop, nests cleanly, and is sticky by construction.
// Early chapters unlock fast (sessions 1 and 3) to hook gently; the tail is open.
// Thresholds are flagged for tuning like the season thresholds.
export const CHAPTERS = [
  {
    id: 'stirs',
    title: 'The Grove Stirs',
    rule: { metric: 'grown', n: 1 },
    beats: [
      'oh! you found this place. it has been sleeping a long, quiet while.',
      'you sat down, you began, and one little light blinked awake in the dark. a sprout. the first one.',
    ],
    hook: 'i think more of the grove wants to wake up. your next session might be what stirs it.',
  },
  {
    id: 'mossbright',
    title: 'Mossbright',
    rule: { metric: 'grown', n: 3 },
    beats: [
      'the moss is going green again where you walk. it remembers footsteps, this place.',
      'a few small trees stand where there were none. you made those, just by showing up.',
    ],
    hook: 'there is a soft path leading deeper. it lights a little more each time you tend things.',
  },
  {
    id: 'keeper',
    title: "The Keeper's Path",
    rule: { metric: 'grown', n: 6 },
    beats: [
      'the grove has started to lean toward you, the way plants lean toward a window.',
      'i think it has decided something: you are its keeper now. no pressure. it just likes you.',
    ],
    hook: 'further in, something is waiting to be found. it will keep, for whenever you are ready.',
  },
  {
    id: 'lanternlight',
    title: 'Lanternlight',
    rule: { metric: 'grown', n: 10 },
    beats: [
      'little lanterns have started to glow along the path. one for each evening you came back.',
      'they do not go out when you are away. they just wait, warm, for you.',
    ],
    hook: 'the light reaches a clearing up ahead. i wonder what is growing there.',
  },
  {
    id: 'hollow',
    title: 'The Hollow Wakes',
    rule: { metric: 'grown', n: 15 },
    beats: [
      'there is an old hollow tree at the heart of the grove, and today it sighed and opened one sleepy eye.',
      'it has been here longer than any of us. it seems glad someone gentle came back to tend the place.',
    ],
    hook: 'the hollow hums when you focus. tend a little more and it may tell us its name.',
  },
  {
    id: 'rootsandrain',
    title: 'Roots and Rain',
    rule: { metric: 'grown', n: 22 },
    beats: [
      'a soft rain came through and the whole grove drank it in. roots are reaching, quietly, underground.',
      'rest is part of it too, you know. the grove grows on the quiet days as much as the busy ones.',
    ],
    hook: 'something is knitting the trees together down in the dark. give it time and tending.',
  },
  {
    id: 'longmeadow',
    title: 'The Long Meadow',
    rule: { metric: 'grown', n: 30 },
    beats: [
      'the trees opened up into a wide, golden meadow. you can see how far you have wandered now.',
      'look back if you like. all of this was bare ground once. then you kept coming back.',
    ],
    hook: 'there is a rise at the meadow’s edge. i have a feeling the view from the top is worth it.',
  },
  {
    id: 'evergreen',
    title: 'Evergreen',
    rule: { metric: 'grown', n: 45 },
    beats: [
      'we made it to the high green, you and i. the grove is wide awake now, and so are you.',
      'this is not an ending. groves do not end. they just keep growing, one gentle visit at a time.',
    ],
    hook: 'the path keeps going past here, into mist and new trees. we will follow it together, whenever.',
  },
]

export const CHAPTERS_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]))

/** Derive the story metrics (all monotonic) from the existing stores. */
export function storyMetrics({
  garden = [],
  spirits = {},
  stats = {},
  flashcardStats = {},
  reflections = [],
  focusLog = {},
} = {}) {
  const activeDays = Object.values(focusLog).filter((d) => d && d.sessions > 0).length
  return {
    grown: garden.length,
    activeDays,
    spiritsMet: Object.keys(spirits?.unlocked || {}).length,
    reflections: reflections?.length || 0,
    reviews: flashcardStats?.total || 0,
    streak: stats?.streak || 0, // greeting flavor only — never gates a chapter
  }
}

/** Every chapter whose milestone is met (sticky/retroactive via grove's progressFor). */
export function unlockedChapters(metrics) {
  return CHAPTERS.filter((c) => progressFor(c, metrics).done)
}

/** The furthest chapter reached, or null before the very first session. Pure. */
export function deriveCurrentChapter(metrics) {
  const unlocked = unlockedChapters(metrics)
  return unlocked.length ? unlocked[unlocked.length - 1] : null
}

/** The next locked chapter (for a soft "what's ahead" hint), or null at the end. */
export function nextChapter(metrics) {
  return CHAPTERS.find((c) => !progressFor(c, metrics).done) || null
}

// ── Return classification (LOCAL day) ────────────────────────────────────────
/** Whole local-day gap between two timestamps (null if no prior visit). */
export function dayGap(lastSeen, now = Date.now()) {
  if (!lastSeen) return null
  return Math.round((startOfDay(new Date(now)) - startOfDay(new Date(lastSeen))) / DAY)
}

/**
 * Classify a return by local-day gap. Same-day returns and clock skew read as
 * SAME; a fresh install reads as FIRST. Boundaries use local midnight so 23:59 →
 * 00:01 counts as a new day, and a gap of exactly COMEBACK_GAP_DAYS reads LONG.
 */
export function classifyReturn(lastSeen, now = Date.now()) {
  const gap = dayGap(lastSeen, now)
  if (gap == null) return RETURN.FIRST
  if (gap <= 0) return RETURN.SAME
  if (gap < COMEBACK_GAP_DAYS) return RETURN.SHORT
  return RETURN.LONG
}

// ── Seeding (deterministic, mirrors verseOfDay's date-hash idea) ─────────────
/** FNV-1a string hash → uint32. */
export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** A stable seed for the day's greeting/comeback (changes once per local day). */
export function dailySeed(lastSeen, now = Date.now()) {
  return hashStr(localDayStr(new Date(now)) + '|' + String(lastSeen || 0))
}

const pick = (arr, seed) => (arr.length ? arr[seed % arr.length] : null)

// ── Greeting facts (accurate; never fabricated) ──────────────────────────────
/**
 * Build the descriptive context a greeting may reference. Every field is real or
 * null; greetings only use fields that are present, so the sprite never claims
 * activity that did not happen.
 */
export function greetingFacts({
  garden = [],
  spirits = {},
  focusLog = {},
  chapter = null,
  companion = null,
  partOfDay = null,
  now = Date.now(),
} = {}) {
  const today = localDayStr(new Date(now))
  const last = garden.length ? garden.reduce((a, b) => (b.ts > a.ts ? b : a)) : null
  const lastSpecies = last ? speciesForDna(last.id) : null

  // Most recently discovered spirit that carries a real date.
  let spirit = null
  let bestTs = -1
  for (const [id, ts] of Object.entries(spirits?.discoveredAt || {})) {
    if (ts != null && ts > bestTs) {
      bestTs = ts
      spirit = SPIRITS_BY_ID[id]?.name || null
    }
  }

  const todaySessions =
    focusLog[today]?.sessions ?? garden.filter((t) => localDayStr(new Date(t.ts)) === today).length

  return {
    name: 'Emily',
    companion: companion || null, // the sprite's chosen name, when she's given it one
    partOfDay: partOfDay || null, // 'dawn' | 'day' | 'dusk' | 'night', when known
    lastTree: lastSpecies?.name ?? (last ? 'a little tree' : null),
    spirit,
    chapter: chapter?.title ?? null,
    todaySessions: todaySessions || 0,
    grown: garden.length,
  }
}

/** A friendly word for the part of day, used only when one is known. */
const PART_OF_DAY_WORD = { dawn: 'morning', day: 'afternoon', dusk: 'evening', night: 'night' }

// ── Greeting library (original; warm, casual, never guilt) ───────────────────
// Each entry: { needs: [factKeys], line: (facts) => string }. An entry is only
// eligible when every needed fact is present, so nothing is ever fabricated.
const NEUTRAL = [
  { needs: [], line: (f) => `hey ${f.name}. the kettle’s on. whenever you’re ready, i’m here.` },
  { needs: [], line: () => `oh good, it’s you. the grove’s been calm and waiting. no rush at all.` },
  { needs: [], line: (f) => `hi ${f.name}. take a breath. pick one little thing. that’s plenty.` },
]

export const GREETINGS = {
  [RETURN.FIRST]: [
    {
      needs: [],
      line: (f) => `oh, hello ${f.name}! welcome. i’m the soot sprite who looks after this grove.`,
    },
    {
      needs: ['companion'],
      line: (f) =>
        `oh, hello ${f.name}! i’m ${f.companion}, and i look after this little grove. so glad you’re here.`,
    },
    {
      needs: [],
      line: () => `you’re here! the grove’s been sleepy and quiet. let’s wake a little of it together.`,
    },
  ],
  [RETURN.SAME]: [
    {
      needs: ['todaySessions'],
      line: (f) => `back already? lovely. that’s ${f.todaySessions} today. only if you want more.`,
    },
    {
      needs: ['partOfDay'],
      line: (f) =>
        `lovely ${PART_OF_DAY_WORD[f.partOfDay]} so far, ${f.name}. back for a little more? only if you’d like.`,
    },
    { needs: ['chapter'], line: (f) => `still here with me in “${f.chapter}.” cozy, isn’t it.` },
    {
      needs: ['companion'],
      line: (f) => `it’s ${f.companion} again. so nice to have you back, ${f.name}.`,
    },
    {
      needs: ['lastTree'],
      line: (f) => `${f.lastTree} is settling in nicely. nice to see you again, ${f.name}.`,
    },
    ...NEUTRAL,
  ],
  [RETURN.SHORT]: [
    {
      needs: ['lastTree'],
      line: (f) => `welcome back, ${f.name}. ${f.lastTree} held its spot for you. want to tend a bit?`,
    },
    {
      needs: ['companion'],
      line: (f) => `it’s ${f.companion}. i kept your spot warm, ${f.name}. come sit a while.`,
    },
    {
      needs: ['partOfDay'],
      line: (f) =>
        `welcome back, ${f.name}. it’s a soft ${PART_OF_DAY_WORD[f.partOfDay]} for tending the grove.`,
    },
    {
      needs: ['spirit'],
      line: (f) => `there you are. ${f.spirit} kept me company while you were out. glad you’re back.`,
    },
    {
      needs: ['chapter'],
      line: (f) => `good to see you. we left off in “${f.chapter}.” it’s right where you set it down.`,
    },
    ...NEUTRAL,
  ],
  [RETURN.LONG]: [
    { needs: [], line: (f) => `${f.name}! there you are. i kept your spot warm. so glad you came back.` },
    {
      needs: ['companion'],
      line: (f) => `${f.name}! it’s ${f.companion}. i kept your spot warm, and i’m so glad you’re back.`,
    },
    {
      needs: ['chapter'],
      line: (f) => `welcome home. “${f.chapter}” waited for you, patient as ever. no rush to pick it up.`,
    },
    {
      needs: ['spirit'],
      line: (f) => `you’re back! ${f.spirit} and i were just thinking of you. come in, come in.`,
    },
  ],
}

const GREETINGS_NEUTRAL = NEUTRAL

/**
 * Deterministically choose a greeting line for a return type, using only facts
 * that are actually present. Seed it with `dailySeed` for stable, once-per-day
 * selection. Always returns a kind line.
 */
export function pickGreeting(facts, returnType, seed = 0) {
  const pool = (GREETINGS[returnType] || GREETINGS[RETURN.SAME]).filter((g) =>
    g.needs.every((k) => facts[k] != null && facts[k] !== ''),
  )
  const usable = pool.length ? pool : GREETINGS_NEUTRAL
  return pick(usable, seed).line(facts)
}

// ── Comeback gift (positive only) ────────────────────────────────────────────
/** Short, welcoming notes left while she rested. Never references loss or fault. */
export const COMEBACK_NOTES = [
  'while you were away, a wildflower opened all on its own. the grove wanted you to have it.',
  'a little bloom came up by the path overnight. i think it was waiting to say welcome back.',
  'the rain came and went, and left a little flower here for you. your spot is exactly as you set it down.',
  'one of the spirits tucked a flower here for when you returned. no note, just a kindness.',
]

/**
 * A deterministic welcome-back event from the gap + seed: a blossoming tree (via
 * the shared generator) and a kind note. Always positive; the gap is only ever a
 * reason for a gift, never a fault.
 * @returns {{ gapDays:number, note:string, bloomDna:number, title:string }}
 */
export function buildComeback(gapDays, seed = 0) {
  const note = pick(COMEBACK_NOTES, seed)
  // A blossoming varietal: blossom-pink (palette 2) or golden (4), shape/pattern
  // varied by the seed so each comeback bloom feels a little different.
  const palette = seed % 2 === 0 ? 2 : 4
  const shape = seed % 4
  const pattern = Math.floor(seed / 4) % 3
  const bloomDna = dnaOf({ shape, trunk: 0, pattern, palette })
  return { gapDays, note, bloomDna, title: 'While you were away' }
}

/** The local-day key used to show the comeback at most once per day. */
export function comebackDayKey(now = Date.now()) {
  return localDayStr(new Date(now))
}

/**
 * Sanitize a companion name she typed: trim, collapse inner whitespace, drop
 * control characters, and cap the length. Returns null for an empty result, so an
 * unnamed companion always reads as "no name".
 */
export function cleanName(raw) {
  if (typeof raw !== 'string') return null
  let out = ''
  for (const ch of raw) {
    const code = ch.codePointAt(0)
    if (code < 0x20 || code === 0x7f) continue // skip control characters
    out += ch
  }
  const cleaned = out.replace(/\s+/g, ' ').trim().slice(0, 24)
  return cleaned.length ? cleaned : null
}

/**
 * Sanitize a keeper's note she wrote for a chapter: drop control characters
 * (keeping ordinary punctuation), collapse runs of whitespace, trim, and cap the
 * length. Returns '' for an empty result, which clears the note. Mirrors cleanName.
 */
export function cleanNote(raw) {
  if (typeof raw !== 'string') return ''
  let out = ''
  for (const ch of raw) {
    const code = ch.codePointAt(0)
    // Keep whitespace controls (tab/newline/CR) so they collapse to a space below;
    // drop the rest of the control range and DEL.
    if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f) continue
    out += ch
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 140)
}
