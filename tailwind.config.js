/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slateDeep: 'rgb(var(--slate-deep) / <alpha-value>)',
        slateCard: 'rgb(var(--slate-card) / <alpha-value>)',
        laneOpen: 'rgb(var(--lane-open) / <alpha-value>)',
        laneReserved: 'rgb(var(--lane-reserved) / <alpha-value>)',
        laneClosed: 'rgb(var(--lane-closed) / <alpha-value>)',
        laneUnknown: 'rgb(var(--lane-unknown) / <alpha-value>)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
}
