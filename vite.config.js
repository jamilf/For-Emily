import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
// Base path is target-aware so one build serves correctly everywhere:
//   - Cloudflare Workers / local dev: root (`/`) — the default.
//   - GitHub Pages: the repo subpath, via DEPLOY_BASE=/For-Emily/ set in the
//     Pages workflow, so assets resolve at https://jamilf.github.io/For-Emily/.
export default defineConfig(() => ({
  base: process.env.DEPLOY_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: "Emily's Study Sanctuary",
        short_name: 'Sanctuary',
        description: 'A cozy, calm study companion.',
        // Relative paths so everything resolves under the /For-Emily/ subpath.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#E0719C',
        background_color: '#E0719C',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell + all hashed assets so the app works
        // offline and updates cleanly across deploys (autoUpdate revisions these).
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Google Fonts (CSS + font files) — keep the app rendering offline.
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Keep React in its own chunk so app edits don't bust its long-lived cache.
      output: { manualChunks: { vendor: ['react', 'react-dom'] } },
    },
  },
}))
