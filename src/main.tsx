// ============================================================
// FILE: src/main.tsx (COMPLETE)
// ============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { cleanupAuthParams } from './utils/auth-cleanup'

cleanupAuthParams()

const handleHashChange = () => {
  const hash = window.location.hash
  if (
    hash.includes('access_token') ||
    hash.includes('refresh_token') ||
    hash.includes('code=')
  ) {
    cleanupAuthParams()
  }
}

window.addEventListener('hashchange', handleHashChange)
window.addEventListener('popstate', () => {
  const hash = window.location.hash
  if (
    hash.includes('access_token') ||
    hash.includes('refresh_token') ||
    hash.includes('code=')
  ) {
    cleanupAuthParams()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
