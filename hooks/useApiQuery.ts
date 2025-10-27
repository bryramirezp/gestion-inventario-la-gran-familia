// hooks/useApiQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

// Generic hook for API queries with caching
export const useApiQuery = <T>(
  queryKey: string[],
  queryFn: (token: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) => {
  const { getToken, logout } = useAuth();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        return await queryFn(token);
      } catch (error: any) {
        // Manejar errores de autenticación
        if (error?.message?.includes('JWT') || error?.status === 401) {
          await logout();
          throw new Error('Session expired. Please login again.');
        }
        throw error;
      }
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
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
      } catch (error: any) {
        // Manejar errores de autenticación
        if (error?.message?.includes('JWT') || error?.status === 401) {
          await logout();
          throw new Error('Session expired. Please login again.');
        }
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);

      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: options?.onError,
  });
};