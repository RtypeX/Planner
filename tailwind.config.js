/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bdd1ff',
          300: '#8eb1ff',
          400: '#5a87ff',
          500: '#3b66ff',
          600: '#2548ed',
          700: '#1c38d4',
          800: '#1c30a8',
          900: '#1d2e84',
        },
        ink: {
          50:  '#f6f7fb',
          100: '#eceff7',
          900: '#0a0d18',
          950: '#06080f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        'soft-lg': '0 8px 24px -8px rgba(15,23,42,0.12), 0 4px 8px -4px rgba(15,23,42,0.06)',
        'glow-brand': '0 8px 32px -8px rgba(59, 102, 255, 0.45)',
        'glow-emerald': '0 8px 32px -8px rgba(16, 185, 129, 0.45)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: 0, transform: 'translateY(-8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
