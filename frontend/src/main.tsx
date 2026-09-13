import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Bridge chromeLite to window.chrome if available in the main world
if (typeof window !== 'undefined') {
  const bridge = (window as any).chromeLite || (window as any).chromeAPI || (window as any).api;
  if (bridge) {
    if ((window as any).chrome) {
      try {
        for (const key of Object.keys(bridge)) {
          try {
            (window as any).chrome[key] = bridge[key];
          } catch { }
        }
      } catch { }
    } else {
      try {
        (window as any).chrome = bridge;
      } catch { }
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
