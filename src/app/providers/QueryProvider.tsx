import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryClient configurado con estrategias de caching optimizadas
 * - Retry logic mejorado (no reintentar en errores 4xx)
 * - Configuración por defecto para queries
 * - Configuración por defecto para mutaciones
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración por defecto (puede ser sobrescrita por query individual)
      staleTime: 5 * 60 * 1000, // 5 minutes (default)
      gcTime: 10 * 60 * 1000, // 10 minutes (default)
      refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
      refetchOnMount: true, // Refetch al montar el componente si los datos están stale
      refetchOnReconnect: true, // Refetch al reconectar a internet
      // Retry logic mejorado
      retry: (failureCount, error: unknown) => {
        // No reintentar en errores 4xx (client errors)
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          typeof (error as { status: number }).status === 'number'
        ) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      // Configuración por defecto para mutaciones
      retry: 1, // Reintentar una vez en caso de error de red
      retryDelay: 1000, // Esperar 1 segundo antes de reintentar
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;