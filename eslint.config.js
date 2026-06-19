import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

// Flat config (ESLint 9). React 18 + hooks + jsx-a11y, with Prettier last to turn
// off any stylistic rules that would fight the formatter.
export default [
  { ignores: ['dist/**', 'dev-dist/**', 'coverage/**', 'playwright-report/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Keep the classic Rules of Hooks (error) and dependency hints (warn).
      'react-hooks/exhaustive-deps': 'warn',
      // The react-hooks v7 plugin bundles experimental React-Compiler rules.
      // This codebase doesn't use the compiler; these flag intentional, correct
      // patterns (effect-driven status resets, module-scope render helpers,
      // functional-updater mutations), so they're disabled rather than silenced
      // case-by-case. Classic rules-of-hooks/exhaustive-deps stay on above.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      // Modals deliberately move focus on open (close button / first field) and
      // are fully keyboard-dismissible (Esc) with a focus trap added in
      // useFocusTrap; autofocus here aids, not harms, accessibility.
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  // Test + e2e files: add the relevant test globals.
  {
    files: ['**/*.{test,spec}.{js,jsx}', 'src/test/**', 'e2e/**'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
  prettier,
]
