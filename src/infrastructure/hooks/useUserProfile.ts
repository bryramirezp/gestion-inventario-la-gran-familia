// hooks/useUserProfile.ts
import { useApiQuery } from './useApiQuery';
import { supabase } from '@/data/api';
import { useAuth } from '@/app/providers/AuthProvider';

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  role_id: number | null;
  role_name: string;
  is_active: boolean;
  warehouse_access: number[];
}

export const useUserProfile = () => {
  const { user: authUser, loading: authLoading } = useAuth();

  return useApiQuery<UserProfile>(
    ['userProfile', authUser?.id], // Agregar dependencia del user ID
    async (_token) => {
      if (!authUser?.id) {
        throw new Error('No authenticated user');
      }

      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('user_id, full_name, role_id, is_active')
          .eq('user_id', authUser.id) // Filtrar por el usuario autenticado
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          throw error;
        }

        if (!user) {
          throw new Error('User not found in database');
        }

        // Obtener datos adicionales en paralelo
        const [roleResult, accessResult] = await Promise.all([
          supabase
            .from('roles')
            .select('role_name')
            .eq('role_id', user.role_id)
            .single(),
          supabase
            .from('user_warehouse_access')
            .select('warehouse_id')
            .eq('user_id', user.user_id)
        ]);

        if (roleResult.error) {
          console.error('Error fetching role:', roleResult.error);
        }

        if (accessResult.error) {
          console.error('Error fetching warehouse access:', accessResult.error);
        }

        return {
          ...user,
          role_name: roleResult.data?.role_name || 'Unknown',
          warehouse_access: accessResult.data?.map(a => a.warehouse_id) || []
        };
      } catch (error) {
        console.error('Error in useUserProfile:', error);
        throw error;
      }
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos para el perfil
      enabled: !authLoading && !!authUser?.id, // Solo ejecutar si auth terminó de cargar y hay usuario
      retry: 1, // Solo reintentar una vez
    }
  );
};