/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // System colors — modeled after Apple's semantic palette
        sys: {
          blue:    '#0a84ff',
          indigo:  '#5e5ce6',
          purple:  '#bf5af2',
          pink:    '#ff375f',
          red:     '#ff453a',
          orange:  '#ff9f0a',
          yellow:  '#ffd60a',
          green:   '#30d158',
          mint:    '#63e6e2',
          teal:    '#40c8e0',
          cyan:    '#64d2ff',
        },
        // App background — deep cool charcoal with a hint of blue
        canvas: {
          900: '#000000',
          800: '#0a0a0f',
          700: '#13131a',
          600: '#1c1c24',
          500: '#26262e',
        },
        // Map old brand tokens to system blue so existing colors don't break
        brand: {
          50:  '#e6f2ff',
          100: '#bfdcff',
          200: '#94c4ff',
          300: '#5fa6ff',
          400: '#2e8aff',
          500: '#0a84ff',
          600: '#0066cc',
          700: '#004f9e',
          800: '#003d7a',
          900: '#002e5c',
          950: '#001f3d',
        },
      },
      fontFamily: {
        // SF Pro stack — falls back to Inter, then system
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"',
          'Inter', 'system-ui', 'sans-serif',
        ],
        display: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"',
          'Inter', 'system-ui', 'sans-serif',
        ],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        // Glass elevation — outer + inner highlight + inner edge
        'glass-sm': '0 1px 2px rgba(0,0,0,0.20), 0 4px 12px -4px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-md': '0 2px 4px rgba(0,0,0,0.25), 0 12px 32px -8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-lg': '0 8px 16px rgba(0,0,0,0.30), 0 32px 80px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
        'glass-xl': '0 12px 24px rgba(0,0,0,0.35), 0 48px 120px -16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.14)',
        'glow-blue':   '0 0 0 1px rgba(10,132,255,0.30), 0 8px 32px -8px rgba(10,132,255,0.45)',
        'glow-purple': '0 0 0 1px rgba(191,90,242,0.30), 0 8px 32px -8px rgba(191,90,242,0.45)',
        'glow-green':  '0 0 0 1px rgba(48,209,88,0.30), 0 8px 32px -8px rgba(48,209,88,0.40)',
        'press':       'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 1px rgba(0,0,0,0.20)',
      },
      backgroundImage: {
        // Vibrancy gradients — iOS-style subtle hue shifts
        'glass-shine': 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 100%)',
        'glass-edge':  'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
        'aurora-blue':   'radial-gradient(800px 400px at 80% 0%, rgba(10,132,255,0.20), transparent 60%), radial-gradient(600px 400px at 0% 100%, rgba(94,92,230,0.16), transparent 60%)',
        'aurora-purple': 'radial-gradient(800px 400px at 80% 0%, rgba(191,90,242,0.20), transparent 60%), radial-gradient(600px 400px at 0% 100%, rgba(255,55,95,0.14), transparent 60%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'spring-up': {
          '0%':   { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
          '70%':  { opacity: 1, transform: 'translateY(-2px) scale(1.01)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'spring-down': {
          '0%':   { opacity: 0, transform: 'translateY(-10px) scale(0.98)' },
          '70%':  { opacity: 1, transform: 'translateY(2px) scale(1.01)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'spring-in': {
          '0%':   { opacity: 0, transform: 'scale(0.92)' },
          '60%':  { opacity: 1, transform: 'scale(1.02)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'float-up': {
          'from': { opacity: 0, transform: 'translateY(12px)' },
          'to':   { opacity: 1, transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { transform: 'scale(1)',    opacity: 1 },
          '50%':       { transform: 'scale(1.4)', opacity: 0.55 },
        },
        'ping-slow': {
          '0%':   { transform: 'scale(1)',   opacity: 0.55 },
          '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
        'shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'aurora-pan': {
          '0%, 100%': { transform: 'translate3d(0%, 0%, 0)' },
          '50%':       { transform: 'translate3d(4%, 2%, 0)' },
        },
      },
      animation: {
        'fade-in':     'fade-in 240ms cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-up':   'spring-up 480ms cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-down': 'spring-down 480ms cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-in':   'spring-in 360ms cubic-bezier(0.32, 0.72, 0, 1)',
        'float-up':    'float-up 460ms cubic-bezier(0.32, 0.72, 0, 1) backwards',
        'soft-pulse':  'soft-pulse 2.4s ease-in-out infinite',
        'ping-slow':   'ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite',
        'shimmer':     'shimmer 8s ease-in-out infinite',
        'aurora-pan':  'aurora-pan 22s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'ios':    'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring': 'cubic-bezier(0.5, 1.4, 0.5, 1)',
      },
    },
  },
  plugins: [],
}
