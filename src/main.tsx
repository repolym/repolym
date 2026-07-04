
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Security: Remove auth tokens from URL BEFORE React mounts
// Prevents tokens from appearing in browser history, clipboard, or screenshots
// Called synchronously on page load (not in useEffect which has timing window)
if (window.location.hash.includes('access_token') || 
    window.location.hash.includes('refresh_token') ||
    window.location.hash.includes('code')) {
  // Clear hash to remove sensitive params from URL bar and history
  // This preserves intended routing state by using replaceState
  try {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  } catch {
    // Fallback if replaceState fails
    window.location.hash = ''
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
