import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/presentation/styles/index.css'
// Initialize theme before React renders to prevent flash (CSP compliant)
import '@/infrastructure/utils/theme.util'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)