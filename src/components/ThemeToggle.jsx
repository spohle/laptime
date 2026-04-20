import { useEffect, useState } from 'react'

const STORAGE_KEY = 'laptime-theme'

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'default'
    return window.localStorage.getItem(STORAGE_KEY) || 'default'
  })

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  return (
    <div
      className="flex flex-col items-end gap-1"
      role="group"
      aria-label="Color theme"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Theme</span>
      <div className="inline-flex rounded-md border border-white/15 bg-black/25 p-0.5">
        <button
          type="button"
          onClick={() => setTheme('default')}
          className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
            theme === 'default'
              ? 'bg-slateCard text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Default
        </button>
        <button
          type="button"
          onClick={() => setTheme('amber')}
          className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
            theme === 'amber'
              ? 'bg-slateCard text-laneOpen shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Amber
        </button>
      </div>
    </div>
  )
}

export default ThemeToggle
