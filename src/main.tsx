// ============================================================
// FILE: src/main.tsx (COMPLETE)
// ============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { stripAuthParamsBeforeMount } from './utils/auth-cleanup'

// Runs once, before the router mounts — safe to rewrite window.location
// directly here since nothing is listening for route changes yet. Any
// cleanup needed AFTER mount goes through AuthContext + React Router's
// navigate() instead, so the URL bar and the router's internal state can
// never fall out of sync.
stripAuthParamsBeforeMount()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
