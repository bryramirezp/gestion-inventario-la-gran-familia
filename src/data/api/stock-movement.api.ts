import { StockMovement, NewStockMovement, StockMovementWithType } from '@/domain/types';
import { supabase } from './client';

export const stockMovementApi = {
  create: async (
    token: string,
    lotId: number,
    movementTypeId: number,
    quantity: number,
    notes?: string,
    requestingDepartment?: string,
    recipientOrganization?: string,
    referenceId?: string
  ): Promise<StockMovement> => {
    const { data, error } = await supabase.rpc('register_stock_movement', {
      p_lot_id: lotId,
      p_movement_type_id: movementTypeId,
      p_quantity: quantity,
      p_notes: notes || null,
      p_requesting_department: requestingDepartment || null,
      p_recipient_organization: recipientOrganization || null,
      p_reference_id: referenceId || null,
    });
    if (error) throw new Error(error.message);
    if (!data || !data.movement_id) {
      throw new Error('No se pudo crear el movimiento');
    }
    const { data: movement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('movement_id', data.movement_id)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return movement;
  },

  getAll: async (
    token: string,
    filters?: {
      lotId?: number;
      movementTypeId?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<StockMovementWithType[]> => {
    let query = supabase
      .from('stock_movements')
      .select(
        `
        *,
        movement_type:movement_types(*),
        lot:stock_lots(
          *,
          product:products(product_id, product_name, sku)
        )
        `
      )
      .order('created_at', { ascending: false });

    if (filters?.lotId) {
      query = query.eq('lot_id', filters.lotId);
    }
    if (filters?.movementTypeId) {
      query = query.eq('movement_type_id', filters.movementTypeId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  getByLot: async (token: string, lotId: number): Promise<StockMovementWithType[]> => {
    return stockMovementApi.getAll(token, { lotId });
  },

  getByType: async (token: string, movementTypeId: number): Promise<StockMovementWithType[]> => {
    return stockMovementApi.getAll(token, { movementTypeId });
  },
};

