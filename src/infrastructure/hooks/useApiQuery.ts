// hooks/useApiQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { getCacheConfig, CacheStrategy } from '@/infrastructure/config/query.config';

// Generic hook for API queries with caching
export const useApiQuery = <T>(
  queryKey: string[],
  queryFn: (token: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    cacheStrategy?: CacheStrategy;
  }
) => {
  const { getToken, logout } = useAuth();

  // Obtener configuración de caching (puede ser sobrescrita por options)
  const cacheConfig = options?.cacheStrategy
    ? undefined // Si se especifica una estrategia, se aplicará después
    : getCacheConfig(queryKey);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        return await queryFn(token);
      } catch (error: unknown) {
        // Manejar errores de autenticación
        if (
          (error instanceof Error && error.message?.includes('JWT')) ||
          (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401)
        ) {
          await logout();
          throw new Error('Session expired. Please login again.');
        }
        throw error;
      }
    },
    // Usar configuración de estrategia o valores personalizados
    staleTime: options?.staleTime ?? cacheConfig?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? cacheConfig?.gcTime ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? cacheConfig?.refetchOnWindowFocus ?? false,
    refetchOnMount: cacheConfig?.refetchOnMount ?? true,
    refetchOnReconnect: cacheConfig?.refetchOnReconnect ?? true,
    enabled: (options?.enabled ?? true) && !!getToken(),
  });
};

// Generic hook for API mutations
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables, token: string) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: unknown, variables: TVariables) => unknown;
    };
    onMutate?: (variables: TVariables) => Promise<unknown> | unknown;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  }
) => {
  const { getToken, logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        return await mutationFn(variables, token);
      } catch (error: unknown) {
        // Manejar errores de autenticación
        if (
          (error instanceof Error && error.message?.includes('JWT')) ||
          (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401)
        ) {
          await logout();
          throw new Error('Session expired. Please login again.');
        }
        throw error;
      }
    },
    // Optimistic update: actualizar la UI inmediatamente antes de que la mutación complete
    onMutate: async (variables) => {
      // Cancelar queries en progreso para evitar sobrescribir la actualización optimista
      if (options?.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey });
      }

      // Ejecutar callback personalizado si existe
      const context = options?.onMutate ? await options.onMutate(variables) : undefined;

      // Snapshot del valor anterior para rollback en caso de error
      let previousData: unknown = undefined;
      if (options?.optimisticUpdate) {
        previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey);

        // Aplicar actualización optimista
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          (old: unknown) => options.optimisticUpdate!.updateFn(old, variables)
        );
      }

      // Retornar contexto con snapshot para rollback
      return { previousData, ...(typeof context === 'object' ? context : {}) };
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables);

      // Invalidate related queries para asegurar sincronización con el servidor
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Si hay actualización optimista, actualizar con los datos reales del servidor
      if (options?.optimisticUpdate && data) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, data);
      }
    },
    onError: (error, variables, context) => {
      // Rollback: restaurar datos anteriores en caso de error
      if (options?.optimisticUpdate && context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }

      options?.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      // Invalidar queries relacionadas al finalizar (éxito o error)
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      options?.onSettled?.(data, error, variables);
    },
  });
};