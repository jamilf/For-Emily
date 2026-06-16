import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// On `build` we set the base path to the GitHub Pages repo subpath so assets
// resolve at https://jamilf.github.io/For-Emily/. Local dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/For-Emily/' : '/',
  plugins: [react()],
}))
