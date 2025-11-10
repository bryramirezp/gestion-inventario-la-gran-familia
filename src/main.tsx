import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import ErrorBoundary from '@/app/components/ErrorBoundary'
import { EnvChecker } from '@/app/components/EnvChecker'
import '@/presentation/styles/index.css'
// Initialize theme before React renders to prevent flash (CSP compliant)
import '@/infrastructure/utils/theme.util'

// Ocultar el fallback de carga una vez que React se monte
const hideLoadingFallback = () => {
  const fallback = document.getElementById('loading-fallback');
  if (fallback) {
    fallback.style.display = 'none';
  }
};

// Manejar errores globales de carga de scripts
window.addEventListener('error', (event) => {
  console.error('Global error:', event);
  if (event.target && (event.target as HTMLElement).tagName === 'SCRIPT') {
    console.error('Error loading script:', (event.target as HTMLScriptElement).src);
    hideLoadingFallback();
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; z-index: 9999; text-align: center;';
    errorElement.innerHTML = '<strong>Error al cargar la aplicación</strong><br>Por favor, verifica la consola del navegador para más detalles.';
    document.body.appendChild(errorElement);
  }
}, true);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <EnvChecker>
          <App />
        </EnvChecker>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  // Ocultar el fallback después de un breve delay para permitir que React se monte
  setTimeout(hideLoadingFallback, 100);
} catch (error) {
  console.error('Error mounting React app:', error);
  hideLoadingFallback();
  const errorElement = document.createElement('div');
  errorElement.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; z-index: 9999; text-align: center;';
  errorElement.innerHTML = `<strong>Error al iniciar la aplicación</strong><br>${error instanceof Error ? error.message : 'Error desconocido'}`;
  document.body.appendChild(errorElement);
}