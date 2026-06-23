// Typed free-recall + cloze helpers. PURE and deterministic (no Web APIs, no
// Date, no Math.random), so it is fully unit-testable and coverage-gated.
//
// Free recall (typing the answer, then judging it) beats flip-and-self-rate
// because it forces effortful RETRIEVAL and GENERATION rather than mere
// recognition, which sidesteps the "fluency illusion" (a flipped card feels known
// even when it is not). Matching is deliberately lenient: spelling is not the
// skill under test, so case, spacing, punctuation, and small typos are forgiven,
// and the learner always keeps the final say via an explicit self-override.

/**
 * Canonical form for comparison: lowercased, trimmed, accents removed, internal
 * whitespace collapsed, and surrounding punctuation stripped. Pure.
 */
export function normalizeAnswer(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (cafe matches cafe with accent)
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ') // punctuation/symbols to spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/** Classic iterative Levenshtein edit distance. Pure, dependency-free. */
export function levenshtein(a, b) {
  a = String(a ?? '')
  b = String(b ?? '')
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/**
 * Split an expected answer into acceptable alternates. Either "a; b" or "a / b"
 * (semicolon, or slash with surrounding spaces so dates like 9/11 stay whole).
 */
export function expectedAlternates(expected) {
  return String(expected ?? '')
    .split(/;|\s\/\s/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Length-scaled typo tolerance: short answers must be near-exact; longer ones
 * forgive a little more. ~1 edit for <6 chars, ~2 for longer.
 */
function allowedEdits(len) {
  if (len < 3) return 0
  if (len < 6) return 1
  return 2
}

/**
 * Compare a typed answer to the expected one (which may carry alternates).
 * Lenient: case/space/punctuation/accents never count, and a small edit distance
 * is treated as correct. Just outside that window is flagged `close` so the UI can
 * suggest a gentle "Hard" while still letting her self-judge.
 * @returns {{ correct: boolean, close: boolean }}
 */
export function matchAnswer(typed, expected) {
  const t = normalizeAnswer(typed)
  if (!t) return { correct: false, close: false }
  let best = Infinity
  for (const alt of expectedAlternates(expected)) {
    const e = normalizeAnswer(alt)
    if (!e) continue
    if (t === e) return { correct: true, close: false }
    const d = levenshtein(t, e)
    if (d < best) best = d
    const tol = allowedEdits(e.length)
    if (d <= tol) return { correct: true, close: false }
  }
  // Within one extra edit of the tolerance reads as a near miss, not a fail.
  return { correct: false, close: best !== Infinity && best <= 3 }
}

const CLOZE_RE = /\{\{(.+?)\}\}/g

/** True when text carries at least one `{{deletion}}`. */
export function hasCloze(text) {
  CLOZE_RE.lastIndex = 0
  return CLOZE_RE.test(String(text ?? ''))
}

/**
 * Parse a cloze string. `{{word}}` marks a deletion. Returns the study `prompt`
 * (deletions shown as a blank), the `answers` (deleted text, in order), and an
 * `isCloze` flag. Non-cloze text passes straight through with `isCloze: false`.
 * Text-only, so it respects the no-asset rule.
 * @returns {{ isCloze: boolean, prompt: string, answers: string[] }}
 */
export function parseCloze(text) {
  const src = String(text ?? '')
  if (!hasCloze(src)) return { isCloze: false, prompt: src, answers: [] }
  const answers = []
  const prompt = src.replace(CLOZE_RE, (_, inner) => {
    answers.push(inner.trim())
    return '[ ____ ]'
  })
  return { isCloze: true, prompt, answers }
}

/** The acceptable answer string for a cloze card (alternates joined by "; "). */
export function clozeAnswerKey(text) {
  return parseCloze(text).answers.join('; ')
}
