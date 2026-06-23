import { describe, it, expect } from 'vitest'
import {
  normalizeAnswer,
  levenshtein,
  expectedAlternates,
  matchAnswer,
  hasCloze,
  parseCloze,
  clozeAnswerKey,
} from './recall.js'

describe('normalizeAnswer', () => {
  it('lowercases, trims, collapses whitespace, and strips punctuation', () => {
    expect(normalizeAnswer('  The   Hippocampus! ')).toBe('the hippocampus')
    expect(normalizeAnswer('a-b, c.')).toBe('a b c')
  })
  it('removes diacritics so accents never matter', () => {
    expect(normalizeAnswer('Café')).toBe('cafe')
    expect(normalizeAnswer('naïve')).toBe('naive')
  })
  it('is null/undefined safe', () => {
    expect(normalizeAnswer(null)).toBe('')
    expect(normalizeAnswer(undefined)).toBe('')
  })
})

describe('levenshtein', () => {
  it('computes a classic edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('abc', 'abc')).toBe(0)
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('abc', '')).toBe(3)
  })
})

describe('expectedAlternates', () => {
  it('splits on semicolons and spaced slashes only', () => {
    expect(expectedAlternates('a; b ; c')).toEqual(['a', 'b', 'c'])
    expect(expectedAlternates('memory / recall')).toEqual(['memory', 'recall'])
    expect(expectedAlternates('9/11')).toEqual(['9/11']) // bare slash stays whole
  })
})

describe('matchAnswer — lenient, kind, honest', () => {
  it('accepts an exact answer regardless of case/space/punctuation', () => {
    expect(matchAnswer('  Hippocampus! ', 'hippocampus').correct).toBe(true)
    expect(matchAnswer('Forms New Memories', 'forms new memories').correct).toBe(true)
  })
  it('forgives a minor typo on a longer answer', () => {
    expect(matchAnswer('hipocamus', 'hippocampus').correct).toBe(true)
  })
  it('requires near-exact spelling on very short answers', () => {
    expect(matchAnswer('ca', 'axon').correct).toBe(false)
  })
  it('accepts any listed alternate', () => {
    expect(matchAnswer('recall', 'memory; recall').correct).toBe(true)
    expect(matchAnswer('memory', 'memory / recall').correct).toBe(true)
  })
  it('flags a near miss as close (not correct) so the UI can suggest Hard', () => {
    const r = matchAnswer('dendryt', 'dendrite')
    expect(r.correct).toBe(true) // within tolerance
    const r2 = matchAnswer('dendron', 'dendrite')
    expect(r2.correct).toBe(false)
    expect(r2.close).toBe(true)
  })
  it('marks a clearly wrong answer wrong and not close', () => {
    expect(matchAnswer('photosynthesis', 'hippocampus')).toEqual({ correct: false, close: false })
  })
  it('treats an empty typed answer as wrong', () => {
    expect(matchAnswer('   ', 'anything')).toEqual({ correct: false, close: false })
  })
})

describe('cloze parsing', () => {
  it('detects deletions', () => {
    expect(hasCloze('the {{x}}')).toBe(true)
    expect(hasCloze('plain')).toBe(false)
  })
  it('renders blanks and collects answers in order', () => {
    const r = parseCloze('The {{hippocampus}} forms {{memories}}.')
    expect(r.isCloze).toBe(true)
    expect(r.prompt).toBe('The [ ____ ] forms [ ____ ].')
    expect(r.answers).toEqual(['hippocampus', 'memories'])
  })
  it('passes non-cloze text through unchanged', () => {
    expect(parseCloze('just text')).toEqual({ isCloze: false, prompt: 'just text', answers: [] })
  })
  it('builds an answer key joining multiple blanks', () => {
    expect(clozeAnswerKey('{{a}} and {{b}}')).toBe('a; b')
  })
  it('grades a cloze answer against its key via matchAnswer', () => {
    const key = clozeAnswerKey('the {{hippocampus}}')
    expect(matchAnswer('Hippocampus', key).correct).toBe(true)
  })
})
