import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App'
import './index.css'
// Initialize theme before React renders to prevent flash (CSP compliant)
import './utils/theme-init'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)