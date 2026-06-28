/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports class-based light/dark toggling
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#070a13',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
