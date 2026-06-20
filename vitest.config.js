import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest runs in jsdom. We deliberately do NOT load vite-plugin-pwa here (its
// `virtual:pwa-register` module only exists in a real build), keeping the test
// environment lean. Coverage thresholds are enforced on the pure-logic modules
// the suite is built around — the scheduler, storage/migration, import parser,
// and the sprite selection bag.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/data/flashcards.js',
        'src/data/scheduler.js',
        'src/data/grove.js',
        'src/data/focusLog.js',
        'src/data/spirits.js',
        'src/data/encouragements.js',
        'src/pixel/SpiritGenerator.js',
        'src/storage/StorageManager.js',
        'src/utils/**/*.js',
      ],
      // ≥80% on the modules the brief calls out (scheduler, storage/migration,
      // parser, selection). Enforced so coverage can't silently regress.
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
})
