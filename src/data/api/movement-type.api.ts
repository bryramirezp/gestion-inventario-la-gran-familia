import { MovementType, NewMovementType, MovementCategory } from '@/domain/types';
import { supabase } from './client';

export const movementTypeApi = {
  getAll: async (_token: string): Promise<MovementType[]> => {
    const { data, error } = await supabase
      .from('movement_types')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('type_name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getByCategory: async (_token: string, category: MovementCategory): Promise<MovementType[]> => {
    const { data, error } = await supabase
      .from('movement_types')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('type_name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getById: async (_token: string, id: number): Promise<MovementType | undefined> => {
    const { data, error } = await supabase
      .from('movement_types')
      .select('*')
      .eq('type_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (token: string, newItem: NewMovementType): Promise<MovementType> => {
    const { data, error } = await supabase
      .from('movement_types')
      .insert(newItem)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (
    token: string,
    id: number,
    updates: Partial<NewMovementType>
  ): Promise<MovementType | undefined> => {
    const { data, error } = await supabase
      .from('movement_types')
      .update(updates)
      .eq('type_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('movement_types').delete().eq('type_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

