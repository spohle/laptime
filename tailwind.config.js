/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slateDeep: '#0f1724',
        slateCard: '#111a2c',
        laneOpen: '#f4c64e',
        laneReserved: '#b688ff',
        laneClosed: '#f5a48a',
        laneUnknown: '#223047',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 12px 20px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}

