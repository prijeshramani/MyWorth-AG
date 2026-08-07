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
          bg: '#0B0B0C',        // Deep obsidian dark background
          secondary: '#15161A', // Secondary dark surface
          card: '#1E2025',      // Card background
          cardHover: '#252830', // Card hover
          border: '#2B2E35',    // Card border
          accent: '#4F7FFF',    // Primary blue accent
          accentHover: '#3B6EEF',
          success: '#32D583',   // Emerald gain
          warning: '#F79009',   // Amber warning
          danger: '#F04438'     // Red loss
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
