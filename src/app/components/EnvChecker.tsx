import React, { ReactNode } from 'react';

interface EnvCheckerProps {
  children: ReactNode;
}

export const EnvChecker: React.FC<EnvCheckerProps> = ({ children }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Error de Configuración
          </h1>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Las variables de entorno de Supabase no están configuradas.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                Variables requeridas:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    VITE_SUPABASE_URL
                  </code>
                  : {supabaseUrl ? (
                    <span className="text-green-600 dark:text-green-400">✓ Configurada</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗ Faltante</span>
                  )}
                </li>
                <li>
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    VITE_SUPABASE_ANON_KEY
                  </code>
                  : {supabaseAnonKey ? (
                    <span className="text-green-600 dark:text-green-400">✓ Configurada</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗ Faltante</span>
                  )}
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                Para solucionar esto:
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                <li>Ve a tu proyecto en Vercel Dashboard</li>
                <li>Navega a <strong>Settings</strong> → <strong>Environment Variables</strong></li>
                <li>Agrega las variables de entorno requeridas</li>
                <li>Redespliega la aplicación</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

