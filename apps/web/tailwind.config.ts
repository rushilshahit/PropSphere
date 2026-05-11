import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1A56DB',
          'primary-dark': '#1239A0',
          secondary: '#0E9F6E',
          accent: '#FF6B35',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
        'card-hover': '0 10px 25px rgba(0,0,0,.12)',
        modal: '0 20px 60px rgba(0,0,0,.18)',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        badge: '100px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'heart-pop': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s linear infinite',
        'heart-pop': 'heart-pop 300ms ease-out',
        'scale-in': 'scale-in 200ms ease',
      },
    },
  },
  plugins: [],
} satisfies Config;
