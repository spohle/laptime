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
    <label className="flex shrink-0 items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Theme</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        className="min-h-9 min-w-[7.5rem] cursor-pointer rounded border border-white/20 bg-slate-900/90 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-100 [color-scheme:dark] sm:min-h-0"
      >
        <option value="default">Default</option>
        <option value="amber">Amber</option>
      </select>
    </label>
  )
}

export default ThemeToggle
