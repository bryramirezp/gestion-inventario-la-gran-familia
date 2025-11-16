import {
  InventoryAdjustment,
  InventoryAdjustmentWithDetails,
  AdjustmentStatus,
} from '@/domain/types';
import { supabase } from './client';

export const adjustmentApi = {
  create: async (
    token: string,
    lotId: number,
    quantityAfter: number,
    reason: string
  ): Promise<InventoryAdjustment> => {
    const { data, error } = await supabase.rpc('create_inventory_adjustment', {
      p_lot_id: lotId,
      p_quantity_after: quantityAfter,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
    if (!data || !data.adjustment_id) {
      throw new Error('No se pudo crear el ajuste');
    }
    const { data: adjustment, error: fetchError } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('adjustment_id', data.adjustment_id)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return adjustment;
  },

  approve: async (token: string, adjustmentId: number, notes?: string): Promise<InventoryAdjustment> => {
    const { data, error } = await supabase.rpc('approve_inventory_adjustment', {
      p_adjustment_id: adjustmentId,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
    const { data: adjustment, error: fetchError } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('adjustment_id', adjustmentId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return adjustment;
  },

  reject: async (
    token: string,
    adjustmentId: number,
    rejectionReason: string
  ): Promise<InventoryAdjustment> => {
    const { data, error } = await supabase.rpc('reject_inventory_adjustment', {
      p_adjustment_id: adjustmentId,
      p_rejection_reason: rejectionReason,
    });
    if (error) throw new Error(error.message);
    const { data: adjustment, error: fetchError } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('adjustment_id', adjustmentId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return adjustment;
  },

  getPending: async (token: string): Promise<InventoryAdjustmentWithDetails[]> => {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select(
        `
        *,
        lot:stock_lots(*),
        created_by_user:users!inventory_adjustments_created_by_fkey(user_id, full_name),
        approved_by_user:users!inventory_adjustments_approved_by_fkey(user_id, full_name),
        rejected_by_user:users!inventory_adjustments_rejected_by_fkey(user_id, full_name)
        `
      )
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getHistory: async (
    token: string,
    filters?: {
      status?: AdjustmentStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<InventoryAdjustmentWithDetails[]> => {
    let query = supabase
      .from('inventory_adjustments')
      .select(
        `
        *,
        lot:stock_lots(*),
        created_by_user:users!inventory_adjustments_created_by_fkey(user_id, full_name),
        approved_by_user:users!inventory_adjustments_approved_by_fkey(user_id, full_name),
        rejected_by_user:users!inventory_adjustments_rejected_by_fkey(user_id, full_name)
        `
      )
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
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
};

