import { User, Role } from '@/domain/types';
import { supabase } from './client';

export const authApi = {
  login: async (
    email: string,
    _password?: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (userError || !user) throw new Error('Usuario no encontrado');
    if (!user.is_active) throw new Error('Tu cuenta ha sido suspendida.');

    // TODO: Add password verification here when authentication is properly implemented
    // For now, accept any password for demo purposes

    // const { data: role } = await supabase
    //   .from('roles')
    //   .select('*')
    //   .eq('role_id', user.role_id)
    //   .single();

    // const { data: warehouseAccess } = await supabase
    //   .from('user_warehouse_access')
    //   .select('warehouse_id')
    //   .eq('user_id', user.user_id);

    return { accessToken: 'managed-by-supabase', refreshToken: 'managed-by-supabase' };
  },
  refreshToken: async (_token: string): Promise<{ accessToken: string; refreshToken: string }> => {
    throw new Error('Token refresh handled automatically by Supabase');
  },
  logout: async (_token: string): Promise<{ success: boolean }> => {
    return { success: true };
  },
  getLoginOptions: async (): Promise<User[]> => {
    // Return empty array since we now use email login
    return [];
  },
};

export const userApi = {
  getAllWithDetails: async (_token: string) => {
    const [usersRes, rolesRes, accessRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('roles').select('*'),
      supabase.from('user_warehouse_access').select('*'),
    ]);
    if (usersRes.error) throw new Error(usersRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (accessRes.error) throw new Error(accessRes.error.message);

    const users = usersRes.data || [];
    const roles = rolesRes.data || [];
    const access = accessRes.data || [];
    const rolesMap = new Map(roles.map((r) => [r.role_id, r.role_name]));

    const detailedUsers = users.map((user) => {
      const userAccess = access
        .filter((a) => a.user_id === user.user_id)
        .map((a) => a.warehouse_id);
      return {
        ...user,
        role_name: rolesMap.get(user.role_id) || 'N/A',
        warehouse_access: userAccess,
      };
    });
    return detailedUsers;
  },
  create: async (
    token: string,
    userData: { full_name: string; role_id: number; warehouse_ids: number[] }
  ): Promise<User> => {
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('full_name')
      .ilike('full_name', userData.full_name);
    if (checkError) throw new Error(checkError.message);
    if (existingUsers && existingUsers.length > 0)
      throw new Error('A user with this name already exists.');

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        full_name: userData.full_name,
        role_id: userData.role_id,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    for (const whId of userData.warehouse_ids) {
      await supabase
        .from('user_warehouse_access')
        .insert({ user_id: newUser.user_id, warehouse_id: whId });
    }

    return newUser;
  },
  updateProfile: async (
    token: string,
    userId: string,
    updates: { full_name: string }
  ): Promise<User | undefined> => {
    if (updates.full_name) {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('full_name')
        .ilike('full_name', updates.full_name)
        .neq('user_id', userId);
      if (checkError) throw new Error(checkError.message);
      if (existingUsers && existingUsers.length > 0)
        throw new Error('A user with this name already exists.');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  updateUserAccess: async (
    token: string,
    userId: string,
    full_name: string,
    role_id: number,
    warehouse_ids: number[]
  ): Promise<boolean> => {
    // Validar que el nombre no esté vacío
    if (!full_name || full_name.trim() === '') {
      throw new Error('El nombre completo es requerido.');
    }

    // Verificar que no exista otro usuario con el mismo nombre (excluyendo el usuario actual)
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('full_name')
      .ilike('full_name', full_name.trim())
      .neq('user_id', userId);
    if (checkError) throw new Error(checkError.message);
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Ya existe un usuario con este nombre.');
    }

    // Actualizar nombre y rol del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        full_name: full_name.trim(),
        role_id 
      })
      .eq('user_id', userId);
    if (updateError) throw new Error(updateError.message);

    // Eliminar acceso a almacenes existente
    const { error: deleteError } = await supabase
      .from('user_warehouse_access')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw new Error(deleteError.message);

    // Agregar nuevos accesos a almacenes
    for (const whId of warehouse_ids) {
      const { error: insertError } = await supabase
        .from('user_warehouse_access')
        .insert({ user_id: userId, warehouse_id: whId });
      if (insertError) throw new Error(insertError.message);
    }
    return true;
  },
  updateUserPassword: async (
    token: string,
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    // Validar la contraseña según los requisitos
    const { validatePassword } = await import('@/data/validation');
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error || 'La contraseña no cumple con los requisitos.');
    }
    
    try {
      // Intentar actualizar la contraseña usando la función PostgreSQL
      // Esta función usa SECURITY DEFINER para actualizar directamente en auth.users
      const { error } = await supabase.rpc('update_user_password_direct', {
        p_user_id: userId,
        p_new_password: newPassword,
      });
      
      if (error) {
        // Si la función PostgreSQL falla, puede ser porque Supabase no permite
        // actualizar encrypted_password directamente. En ese caso, necesitarías
        // crear una Edge Function que use supabase.auth.admin.updateUserById
        throw new Error(`Error al actualizar la contraseña: ${error.message}`);
      }
      
      return true;
    } catch (error: any) {
      // Si hay un error, proporcionar información útil
      console.error('Error updating password:', error);
      throw new Error(error.message || 'Error al actualizar la contraseña. Verifica que la función update_user_password_direct esté creada y tenga los permisos correctos.');
    }
  },
  toggleUserStatus: async (token: string, userId: string): Promise<User> => {
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (selectError) throw new Error(selectError.message);
    if (!user) throw new Error('User not found');

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  deleteUser: async (token: string, userId: string): Promise<boolean> => {
    try {
      // Llamar a la función PostgreSQL que elimina de auth.users y public.users
      const { error } = await supabase.rpc('delete_user_complete', {
        p_user_id: userId,
      });

      if (error) {
        throw new Error(error.message || 'Error al eliminar usuario');
      }

      return true;
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar usuario');
    }
  },
};

export const getRoles = async (_token: string): Promise<Role[]> => {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};
