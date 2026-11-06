/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06080f',
          900: '#0a0e1a',
          850: '#0e1320',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
        },
        neon: {
          cyan: '#22d3ee',
          sky: '#0ea5e9',
          green: '#4ade80',
          amber: '#fbbf24',
          pink: '#f472b6',
          violet: '#a78bfa',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 22px rgba(34, 211, 238, 0.35)',
        'neon-green': '0 0 22px rgba(74, 222, 128, 0.35)',
        'neon-amber': '0 0 22px rgba(251, 191, 36, 0.35)',
        'neon-pink': '0 0 22px rgba(244, 114, 182, 0.35)',
      },
    },
  },
  plugins: [],
};
