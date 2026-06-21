import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// Guardrail: authored, user-facing copy must never contain an em dash (U+2014).
// AI-style dramatic-aside dashes were removed by rephrasing; this keeps them out.
//
// Scope is the two trees where displayed copy lives. Code comments / JSDoc / JSX
// block comments are stripped before scanning (they are not user-facing), and the
// fetched/quoted scripture verses are excluded entirely.

const HERE = dirname(fileURLToPath(import.meta.url))
const EM_DASH = '—'

const ROOTS = ['data', 'components']
const EXCLUDE_FILES = new Set(['scripture.js']) // fetched/quoted verse text — off-limits

// The only em dashes legitimately allowed inside these trees: the bulk-import
// separator list (parsing behaviour, not copy) and scripture citations (quoted refs).
const ALLOW = [
  { file: 'flashcards.js', includes: 'token of [' },
  { file: 'LetterModal.jsx', includes: '.ref}' },
]

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
  }
  return out
}

// Remove /* ... */ (JSDoc + JSX block comments) and trailing // line comments so the
// scan sees only code and displayed string content, never our comment prose.
function stripComments(src) {
  const noBlocks = src.replace(/\/\*[\s\S]*?\*\//g, '')
  return noBlocks
    .split('\n')
    .map((line) => {
      const i = line.indexOf('//')
      return i === -1 ? line : line.slice(0, i)
    })
    .join('\n')
}

describe('no em dashes in authored copy', () => {
  const files = ROOTS.flatMap((r) => walk(join(HERE, r))).filter((f) => !EXCLUDE_FILES.has(basename(f)))

  it('scans a meaningful number of source files', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  for (const file of files) {
    const name = basename(file)
    it(`${name} has no em dash in displayed copy`, () => {
      const stripped = stripComments(readFileSync(file, 'utf8'))
      const offenders = stripped
        .split('\n')
        .map((line, n) => [n + 1, line.trim()])
        .filter(([, line]) => line.includes(EM_DASH))
        .filter(([, line]) => !ALLOW.some((a) => name === a.file && line.includes(a.includes)))
      expect(offenders, `em dash in ${name}: ${JSON.stringify(offenders)}`).toEqual([])
    })
  }
})
