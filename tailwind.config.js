/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paper — warm off-whites for the page background
        paper: {
          50:  '#faf8f3',  // page bg, light
          100: '#f5f1e8',  // card bg, light
          200: '#ebe5d6',  // borders, light
          300: '#d6cfbb',
        },
        // Ink — deep charcoals for text and dark mode surfaces
        ink: {
          50:  '#f5f1e8',
          100: '#d8d4cb',
          200: '#9b9890',
          300: '#6b6862',
          400: '#4a4842',
          500: '#2a2925',
          600: '#1a1916',
          700: '#13110f',
          800: '#0d0c0a',
          900: '#0a0908',  // page bg, dark
          950: '#050403',
        },
        // Ember — warm orange-brown accent (think pottery, dim sun)
        ember: {
          50:  '#fdf6ee',
          100: '#fae8d3',
          200: '#f3cfa3',
          300: '#eaae6b',
          400: '#df8e3e',
          500: '#cf7726',  // primary accent
          600: '#b25d1e',
          700: '#8e481c',
          800: '#723b1d',
          900: '#5e321b',
        },
        // Sage — muted green for "good" / success states (no neon)
        sage: {
          400: '#8aa583',
          500: '#6e8d68',
          600: '#587353',
        },
        // Clay — muted red for warnings (warm, not bright)
        clay: {
          400: '#d97757',
          500: '#c45f3f',
          600: '#a14a31',
        },
        // Steel — desaturated blue for secondary info
        steel: {
          400: '#7d92a8',
          500: '#5e7388',
          600: '#3a516d',
        },
        // Map old brand tokens to ember so we don't have to touch every file.
        brand: {
          50:  '#fdf6ee',
          100: '#fae8d3',
          200: '#f3cfa3',
          300: '#eaae6b',
          400: '#df8e3e',
          500: '#cf7726',
          600: '#b25d1e',
          700: '#8e481c',
          800: '#723b1d',
          900: '#5e321b',
          950: '#3d2113',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
      },
      boxShadow: {
        // Print-feeling shadows — small, soft, no glow
        'soft':    '0 1px 0 rgba(15, 14, 12, 0.04)',
        'soft-md': '0 1px 2px rgba(15, 14, 12, 0.06), 0 0 0 1px rgba(15, 14, 12, 0.04)',
        'soft-lg': '0 4px 16px -8px rgba(15, 14, 12, 0.10)',
        'press':   'inset 0 1px 0 rgba(255, 255, 255, 0.10), inset 0 -1px 0 rgba(0, 0, 0, 0.10)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: 0, transform: 'translateY(-6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'float-up': {
          'from': { opacity: 0, transform: 'translateY(8px)' },
          'to':   { opacity: 1, transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { transform: 'scale(1)',    opacity: 1 },
          '50%':       { transform: 'scale(1.3)', opacity: 0.6 },
        },
        'ping-slow': {
          '0%':   { transform: 'scale(1)',   opacity: 0.55 },
          '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':       { transform: 'rotate(-3deg)' },
          '75%':       { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 240ms ease-out',
        'slide-up':   'slide-up 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-down': 'slide-down 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in':   'scale-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'float-up':   'float-up 380ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
        'ping-slow':  'ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite',
        'wiggle':     'wiggle 320ms ease-in-out',
      },
    },
  },
  plugins: [],
}
