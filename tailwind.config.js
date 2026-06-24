/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Authentic Everforest — Dark Medium backgrounds (cool, soft, warm)
        bgDim: '#232A2E',
        bg0: '#2D353B',
        bg1: '#343F44',
        bg2: '#3D484D',
        bg3: '#475258',

        // Light surfaces (Everforest light bg + paper tones for cozy cards)
        cream: '#FDF6E3', // light bg0
        paper: '#F4F0D9', // light bg1
        latte: '#EFEBD4', // light bg2

        // Wood accents (Ghibli interior)
        brown: '#8F5E36',
        brownDark: '#6E4527',

        // Everforest foreground text + accents
        fg: '#D3C6AA',
        grey: '#859289',
        ever: {
          red: '#E67E80',
          orange: '#E69875',
          yellow: '#DBBC7F',
          green: '#A7C080',
          aqua: '#83C092',
          blue: '#7FBBB3',
          purple: '#D699B6',
        },

        // JRPG dialogue-window tokens (see src/data/jrpgTokens.js; mirrored as CSS
        // custom properties in index.css). Used by the shared GameWindow UI kit.
        jrpg: {
          window: 'var(--jrpg-window-bg)',
          windowHi: 'var(--jrpg-window-hi)',
          text: 'var(--jrpg-window-text)',
          textDim: 'var(--jrpg-window-text-dim)',
          edge: 'var(--jrpg-edge-dark)',
          edgeLight: 'var(--jrpg-edge-light)',
          nameplate: 'var(--jrpg-nameplate-bg)',
          cursor: 'var(--jrpg-cursor)',
          sel: 'var(--jrpg-sel-bg)',
        },

        // Pixel-art sunset / dusk palette (scene + warm accents).
        sunset: {
          indigo: '#352A52', // top-of-sky / deep dusk
          plum: '#5C3A6E',
          magenta: '#9B3D73',
          rose: '#E0719C',
          pink: '#F4A6C0',
          coral: '#F4845F',
          orange: '#F9A857',
          gold: '#FFD27D', // sun / lit windows
          peach: '#FFCBA4',
          teal: '#3FB0AC', // Ghibli water accent
          city: '#2A2140', // near building silhouette
          cityFar: '#5A4A78', // far building silhouette
        },
      },
      fontFamily: {
        // Pixel display font for headings/labels; Inter for readable body.
        display: ['"Pixelify Sans"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cozy: '0 18px 40px -12px rgba(0, 0, 0, 0.45)',
        // Crisp lofi "desktop window" shadow with a hard offset edge.
        window: '0 10px 0 -4px rgba(0,0,0,0.18), 0 22px 45px -16px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
}
