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
        laneUnknownFg: 'rgb(var(--lane-unknown-fg) / <alpha-value>)',
        uiHeading: 'rgb(var(--ui-heading) / <alpha-value>)',
        uiBody: 'rgb(var(--ui-body) / <alpha-value>)',
        uiMuted: 'rgb(var(--ui-muted) / <alpha-value>)',
        uiSoft: 'rgb(var(--ui-soft) / <alpha-value>)',
        uiInput: 'rgb(var(--ui-input) / <alpha-value>)',
        uiElevated: 'rgb(var(--ui-elevated) / <alpha-value>)',
        uiOverlay: 'rgb(var(--ui-overlay) / <alpha-value>)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
}
