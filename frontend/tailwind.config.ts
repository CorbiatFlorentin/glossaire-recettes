import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50:  '#FDFAF5',
          100: '#F5EFE0',
          200: '#E8DCC8',
          300: '#CEBA9A',
          400: '#A8946F',
          500: '#8A7555',
          600: '#6B5940',
          700: '#4E3F2C',
          800: '#322818',
          900: '#1A1208',
        },
        terracotta: {
          50:  '#FDF2EE',
          100: '#FADDD2',
          200: '#F4B89F',
          300: '#EC8E6A',
          400: '#E06840',
          500: '#C94E27',
          600: '#A33B1C',
          700: '#7D2B12',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(50,40,24,0.04), 0 2px 8px rgba(50,40,24,0.06)',
        'card-hover': '0 4px 16px rgba(50,40,24,0.10), 0 8px 24px rgba(50,40,24,0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
