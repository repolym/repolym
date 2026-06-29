/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0b', 1: '#111113', 2: '#18181b',
          3: '#1f1f23', 4: '#27272b',
        },
        border: { subtle: '#2a2a2e', DEFAULT: '#3a3a3f', strong: '#52525b' },
        accent: { DEFAULT: '#6366f1', hover: '#818cf8', muted: '#312e81', subtle: '#1e1b4b' },
        text: { primary: '#f4f4f5', secondary: '#a1a1aa', tertiary: '#71717a', inverse: '#09090b' },
        success: { DEFAULT: '#22c55e', muted: '#14532d' },
        warning: { DEFAULT: '#f59e0b', muted: '#451a03' },
        danger: { DEFAULT: '#ef4444', muted: '#450a0a' },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '1rem' }] },
      borderRadius: { '2xs': '2px', xs: '4px' },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
