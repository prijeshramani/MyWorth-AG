/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0b0f19',       // Deep navy dark background
          card: '#161d30',     // Premium glass dark card
          border: '#242f4c',   // Slate border
          accent: '#6366f1',   // Indigo
          success: '#10b981',  // Emerald
          warning: '#f59e0b',  // Amber
          danger: '#ef4444'    // Red
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
