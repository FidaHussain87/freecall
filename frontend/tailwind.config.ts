import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fc: {
          bg: {
            primary: 'var(--fc-bg-primary)',
            secondary: 'var(--fc-bg-secondary)',
            tertiary: 'var(--fc-bg-tertiary)',
            hover: 'var(--fc-bg-hover)',
            active: 'var(--fc-bg-active)',
          },
          accent: 'var(--fc-accent)',
          'accent-hover': 'var(--fc-accent-hover)',
          'accent-dim': 'var(--fc-accent-dim)',
          text: {
            primary: 'var(--fc-text-primary)',
            secondary: 'var(--fc-text-secondary)',
            muted: 'var(--fc-text-muted)',
          },
          border: 'var(--fc-border)',
          'border-active': 'var(--fc-border-active)',
          green: 'var(--fc-green)',
          red: 'var(--fc-red)',
          orange: 'var(--fc-orange)',
          yellow: 'var(--fc-yellow)',
          purple: 'var(--fc-purple)',
          cyan: 'var(--fc-cyan)',
          pink: 'var(--fc-pink)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '16px',
        'glass-strong': '24px',
      },
      boxShadow: {
        glow: '0 0 15px var(--fc-glow-color)',
        'glow-sm': '0 0 8px var(--fc-glow-color)',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          'background-color': 'var(--fc-glass-bg)',
          'border': '1px solid var(--fc-glass-border)',
        },
        '.glass-strong': {
          'backdrop-filter': 'blur(24px)',
          '-webkit-backdrop-filter': 'blur(24px)',
          'background-color': 'var(--fc-glass-bg-strong)',
          'border': '1px solid var(--fc-glass-border)',
        },
        '.glow-border': {
          'box-shadow': '0 0 15px var(--fc-glow-color), inset 0 0 15px rgba(0,0,0,0.1)',
          'border-color': 'var(--fc-glow-color)',
        },
        '.neon-text': {
          'text-shadow': '0 0 10px var(--fc-glow-color)',
        },
      })
    }),
  ],
} satisfies Config
