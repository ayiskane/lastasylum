import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        asylum: {
          bg: '#0a0c10',
          surface: '#12151c',
          border: '#1e2330',
          accent: '#c9a84c',
          'accent-dim': '#8b7434',
          text: '#e2e0d8',
          muted: '#7a7970',
          quality: {
            white: '#c8c8c8',
            green: '#4ade80',
            blue: '#60a5fa',
            purple: '#c084fc',
            orange: '#fb923c',
            red: '#f87171',
          }
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Source Sans 3"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    }
  },
  plugins: [],
}
export default config
