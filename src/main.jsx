import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/tailwind.css'
import App from './App.jsx'

try {
  const stored = window.localStorage.getItem('laptime-theme')
  document.documentElement.dataset.theme =
    stored === 'amber' || stored === 'default' ? stored : 'default'
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
