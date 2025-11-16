import { StockTransfer, StockTransferWithDetails, TransferStatus } from '@/domain/types';
import { supabase } from './client';

export const transferApi = {
  request: async (
    token: string,
    lotId: number,
    toWarehouseId: number,
    quantity: number,
    notes?: string
  ): Promise<StockTransfer> => {
    const { data, error } = await supabase.rpc('request_stock_transfer', {
      p_lot_id: lotId,
      p_to_warehouse_id: toWarehouseId,
      p_quantity: quantity,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
    if (!data || !data.transfer_id) {
      throw new Error('No se pudo crear la solicitud de traspaso');
    }
    const { data: transfer, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('transfer_id', data.transfer_id)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return transfer;
  },

  approve: async (token: string, transferId: number, notes?: string): Promise<StockTransfer> => {
    const { data, error } = await supabase.rpc('approve_stock_transfer', {
      p_transfer_id: transferId,
      p_notes: notes || null,
    });
    if (error) throw new Error(error.message);
    const { data: transfer, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('transfer_id', transferId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return transfer;
  },

  reject: async (
    token: string,
    transferId: number,
    rejectionReason: string
  ): Promise<StockTransfer> => {
    const { data, error } = await supabase.rpc('reject_stock_transfer', {
      p_transfer_id: transferId,
      p_rejection_reason: rejectionReason,
    });
    if (error) throw new Error(error.message);
    const { data: transfer, error: fetchError } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('transfer_id', transferId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return transfer;
  },

  getPending: async (token: string): Promise<StockTransferWithDetails[]> => {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(
        `
        *,
        lot:stock_lots(*),
        from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(*),
        to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(*),
        requested_by_user:users!stock_transfers_requested_by_fkey(user_id, full_name),
        approved_by_user:users!stock_transfers_approved_by_fkey(user_id, full_name)
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
      status?: TransferStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<StockTransferWithDetails[]> => {
    let query = supabase
      .from('stock_transfers')
      .select(
        `
        *,
        lot:stock_lots(*),
        from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(*),
        to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(*),
        requested_by_user:users!stock_transfers_requested_by_fkey(user_id, full_name),
        approved_by_user:users!stock_transfers_approved_by_fkey(user_id, full_name)
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

