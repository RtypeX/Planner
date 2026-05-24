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
        'float-up': {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'soft-pulse': {
          '0%, 100%': { transform: 'scale(1)',    opacity: 1 },
          '50%':       { transform: 'scale(1.4)', opacity: 0.55 },
        },
        'ping-slow': {
          '0%':       { transform: 'scale(1)',    opacity: 0.55 },
          '100%':     { transform: 'scale(2.4)',  opacity: 0 },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'sheen': {
          '0%':   { transform: 'translateX(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%)  skewX(-12deg)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':       { transform: 'rotate(-6deg)' },
          '75%':       { transform: 'rotate(6deg)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 220ms ease-out',
        'slide-up':   'slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'float-up':   'float-up 480ms cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'shimmer':    'shimmer 8s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
        'ping-slow':  'ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite',
        'gradient-pan': 'gradient-pan 12s ease-in-out infinite',
        'sheen':      'sheen 2.6s ease-in-out infinite',
        'wiggle':     'wiggle 350ms ease-in-out',
      },
    },
  },
  plugins: [],
}
