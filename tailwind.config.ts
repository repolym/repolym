/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#FFFFFF',
          1: '#FAFAFA',
          2: '#F4F4F5',
          3: '#E5E7EB',
          4: '#D1D5DB',
        },
        border: {
          subtle: '#F3F4F6',
          DEFAULT: '#E5E7EB',
          strong: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          muted: '#EEF2FF',
          subtle: '#C7D2FE',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        success: { DEFAULT: '#22C55E', muted: '#F0FDF4' },
        warning: { DEFAULT: '#F59E0B', muted: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', muted: '#FEF2F2' },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
        DEFAULT: '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'modal': '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
        'glass': '0 8px 32px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
