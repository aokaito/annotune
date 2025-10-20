import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f7f0e8',
        foreground: '#3f2a20',
        muted: {
          DEFAULT: '#efe2d1',
          foreground: '#725843'
        },
        primary: {
          DEFAULT: '#8f5a32',
          foreground: '#fdf8f3'
        },
        secondary: {
          DEFAULT: '#c69a6d',
          foreground: '#3f2a20'
        },
        accent: {
          DEFAULT: '#b08968',
          foreground: '#fdf8f3'
        },
        card: '#fffaf4',
        border: '#e0cdb3'
      }
    }
  },
  plugins: []
};

export default config;
