import { createRequire } from 'module';
const _require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:        'var(--color-primary)',
        'primary-light':'var(--color-primary-light)',
        'primary-hover':'var(--color-primary-hover)',
        accent:         'var(--color-accent)',
        'accent-2':     'var(--color-accent-2)',
        'accent-3':     'var(--color-accent-3)',
        success:        'var(--color-success)',
        danger:         'var(--color-danger)',
        surface:        'var(--color-surface)',
        'surface-2':    'var(--color-surface-2)',
        'surface-3':    'var(--color-surface-3)',
        text:           'var(--color-text)',
        'text-muted':   'var(--color-text-muted)',
        border:         'var(--color-border)',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        exo:      ['"Exo 2"', 'sans-serif'],
      },
      boxShadow: {
        glow:          '0 0 20px var(--color-primary)',
        'glow-sm':     '0 0 10px var(--color-primary)',
        'glow-accent': '0 0 20px var(--color-accent)',
      },
      animation: {
        'spin-slow':  'spin 8s linear infinite',
        shimmer:      'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px var(--color-primary)' },
          '50%':      { boxShadow: '0 0 25px var(--color-primary), 0 0 50px var(--color-accent)' },
        },
      },
    },
  },
  plugins: [_require('@tailwindcss/forms')],
};
