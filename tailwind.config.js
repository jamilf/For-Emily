/** @type {import('tailwindcss').Config} */
export default {
  // Scan every component/data file so our custom utilities are generated.
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core "Studio Ghibli meets Everforest" palette
        forest: '#2D352B', // deep forest (background top)
        olive: '#4A5D23', // mossy olive (background bottom)
        cream: '#FDF6E3', // warm beige widget surface
        latte: '#EFF1F5', // latte cream surface
        brown: '#8F5E36', // warm brown accent / terracotta
        brownDark: '#6E4527', // darker brown
        // Everforest accents for small details
        ever: {
          green: '#A7C080',
          aqua: '#83C092',
          yellow: '#DBBC7F',
          red: '#E67E80',
        },
      },
      fontFamily: {
        // Elegant serif for headings, clean sans for body.
        serif: ['"Playfair Display"', 'Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cozy: '0 18px 40px -12px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
}
