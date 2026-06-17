// Flashcard model + Leitner spaced repetition.
//
// A card: { id, deck, front, back, box, due, interval, lastReviewed, reps, struggling }
//   box        Leitner tier 0..5 (0 = new/lapsed, 5 = mastered)
//   due        timestamp (ms) the card is next due — the spec's nextReviewDate
//   interval   current spacing in days
//   reps       times reviewed
//   struggling counts repeated "Again"s so we can resurface tricky cards
//
// Active recall + spacing are the two highest-yield study methods; this engine
// leans on both. Older saved cards (which only had box/due) are upgraded safely
// by normalizeCard, so there is no risky migration.

const DAY = 24 * 60 * 60 * 1000

// Review interval (days) per Leitner box. Box 0 / lapses are due "today".
export const BOX_DAYS = [0, 1, 3, 7, 16, 35]
export const MAX_BOX = BOX_DAYS.length - 1 // 5
export const MASTERED_BOX = MAX_BOX

// Kept for backward-compat with the original simple scheduler.
export const SPACING_DAYS = BOX_DAYS

export function nextDue(box) {
  const days = BOX_DAYS[Math.min(box, MAX_BOX)]
  return Date.now() + days * DAY
}

export function isDue(card) {
  return (card.due ?? 0) <= Date.now()
}

export function countDue(cards) {
  return cards.filter(isDue).length
}

// Fill in any fields missing on older saved cards (defensive, no migration).
export function normalizeCard(c) {
  return {
    box: 1,
    interval: 0,
    reps: 0,
    struggling: 0,
    lastReviewed: null,
    due: Date.now(),
    deck: 'My deck',
    ...c,
  }
}

export function makeCard(front, back, deck) {
  return {
    id: Date.now() + Math.random(),
    deck: deck?.trim() || 'My deck',
    front: front.trim(),
    back: back.trim(),
    box: 1,
    interval: 0,
    reps: 0,
    struggling: 0,
    lastReviewed: null,
    due: Date.now(), // due immediately on creation
  }
}

export const RATINGS = ['again', 'hard', 'good', 'easy']

/**
 * Apply a confidence rating and return the rescheduled card.
 *  again → box 1, due today (resurfaces), struggling++
 *  hard  → stay in box, ~1 day
 *  good  → promote one box, that box's interval
 *  easy  → jump two boxes, the larger of (box interval, current*2)
 */
export function gradeCard(card, rating) {
  const c = normalizeCard(card)
  const now = Date.now()
  let { box, interval, reps, struggling } = c
  reps += 1

  switch (rating) {
    case 'again':
      box = 1
      interval = 0
      struggling += 1
      break
    case 'hard':
      box = Math.max(1, box)
      interval = 1
      struggling = Math.max(0, struggling - 0)
      break
    case 'good':
      box = Math.min(box + 1, MAX_BOX)
      interval = BOX_DAYS[box]
      struggling = Math.max(0, struggling - 1)
      break
    case 'easy':
      box = Math.min(box + 2, MAX_BOX)
      interval = Math.max(BOX_DAYS[box], (interval || 1) * 2)
      struggling = Math.max(0, struggling - 1)
      break
    default:
      break
  }

  const due = rating === 'again' ? now : now + interval * DAY
  return { ...c, box, interval, reps, struggling, lastReviewed: now, due }
}

/** Friendly "next review" label for a rating button (does not mutate). */
export function nextIntervalLabel(card, rating) {
  if (rating === 'again') return 'today'
  if (rating === 'hard') return '1 day'
  const c = normalizeCard(card)
  let days
  if (rating === 'good') days = BOX_DAYS[Math.min(c.box + 1, MAX_BOX)]
  else days = Math.max(BOX_DAYS[Math.min(c.box + 2, MAX_BOX)], (c.interval || 1) * 2)
  return days === 1 ? '1 day' : `${days} days`
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build a capped review queue for a session: due cards first (or the whole deck
 * if none are due so Emily can still study), struggling cards nudged earlier,
 * optionally shuffled, then capped so the session always has a visible end.
 */
export function sessionQueue(cards, { cap = 12, shuffle: doShuffle = true, deck = null } = {}) {
  let pool = cards.map(normalizeCard)
  if (deck) pool = pool.filter((c) => c.deck === deck)

  const due = pool.filter(isDue)
  let base = due.length > 0 ? due : pool
  base = doShuffle ? shuffle(base) : base
  // Stable bias: cards Emily keeps missing surface earlier (struggling desc).
  base = [...base].sort((a, b) => (b.struggling || 0) - (a.struggling || 0))
  return base.slice(0, Math.max(1, cap))
}

/** Decks present, each with total + due counts (for the picker). */
export function decksOf(cards) {
  const map = new Map()
  for (const raw of cards) {
    const c = normalizeCard(raw)
    const entry = map.get(c.deck) || { deck: c.deck, total: 0, due: 0 }
    entry.total += 1
    if (isDue(c)) entry.due += 1
    map.set(c.deck, entry)
  }
  return [...map.values()].sort((a, b) => b.due - a.due || a.deck.localeCompare(b.deck))
}

export function masteredCount(cards) {
  return cards.filter((c) => (normalizeCard(c).box ?? 0) >= MASTERED_BOX).length
}

/**
 * Parse a bulk paste into cards. One card per line as `term — definition`.
 * Also accepts an en dash, a spaced hyphen, or a colon as the separator.
 */
export function parseBulk(text, deck) {
  const out = []
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    let sep = -1
    let sepLen = 1
    for (const token of [' — ', ' – ', ' - ', '—', '–', ':']) {
      const i = line.indexOf(token)
      if (i > 0) {
        sep = i
        sepLen = token.length
        break
      }
    }
    if (sep === -1) continue
    const front = line.slice(0, sep).trim()
    const back = line.slice(sep + sepLen).trim()
    if (front && back) out.push(makeCard(front, back, deck))
  }
  return out
}

// ── Daily review stats (kind: a missed day quietly restarts, never shamed) ───
const EMPTY_STATS = {
  day: '',
  reviewedToday: 0,
  streak: 0,
  lastReviewDay: null,
  correct: 0,
  total: 0,
}

function dayStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayStr(d)
}

export function makeStats() {
  return { ...EMPTY_STATS }
}

/** Record one reviewed card. Updates streak gently and a rolling retention %. */
export function recordReview(prev, rating) {
  const stats = { ...EMPTY_STATS, ...prev }
  const td = dayStr()
  const freshDay = stats.day !== td
  const reviewedToday = (freshDay ? 0 : stats.reviewedToday) + 1

  let streak = stats.streak || 0
  if (stats.lastReviewDay !== td) {
    streak = stats.lastReviewDay === yesterdayStr() ? streak + 1 : 1
  }

  return {
    day: td,
    reviewedToday,
    streak,
    lastReviewDay: td,
    correct: (stats.correct || 0) + (rating === 'again' ? 0 : 1),
    total: (stats.total || 0) + 1,
  }
}

export function retentionPct(stats) {
  const total = stats?.total || 0
  if (!total) return null
  return Math.round(((stats.correct || 0) / total) * 100)
}

// A tiny starter deck so the feature isn't empty on first open (clearable).
export const SEED_CARDS = [
  makeCard('What does the hippocampus do?', 'Forms new memories & spatial navigation', 'Neuroscience'),
  makeCard('Role of dopamine?', 'Reward, motivation, and movement signalling', 'Neuroscience'),
  makeCard('What is qualia?', 'The subjective, felt quality of experience', 'Philosophy'),
]
