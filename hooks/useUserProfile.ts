// hooks/useUserProfile.ts
import { useApiQuery } from './useApiQuery';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  user_id: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  warehouse_access: number[];
}

export const useUserProfile = () => {
  const { user: authUser } = useAuth();

  return useApiQuery<UserProfile>(
    ['userProfile', authUser?.id], // Agregar dependencia del user ID
    async (_token) => {
      if (!authUser?.id) throw new Error('No authenticated user');

      const { data: user, error } = await supabase
        .from('users')
        .select('user_id, full_name, role_id, is_active')
        .eq('user_id', authUser.id) // Filtrar por el usuario autenticado
        .single();

      if (error) throw error;

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

      return {
        ...user,
        role_name: roleResult.data?.role_name || 'Unknown',
        warehouse_access: accessResult.data?.map(a => a.warehouse_id) || []
      };
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos para el perfil
      enabled: !!authUser?.id // Solo ejecutar si hay usuario autenticado
    }
  );
};