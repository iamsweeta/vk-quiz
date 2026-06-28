import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080A12',
        surface: '#101322',
        primary: '#7C3AED',
        cyan: '#22D3EE',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      boxShadow: {
        glow: '0 0 80px rgba(34, 211, 238, 0.22)',
        soft: 'var(--shadow-soft)'
      }
    }
  },
  plugins: []
};

export default config;
