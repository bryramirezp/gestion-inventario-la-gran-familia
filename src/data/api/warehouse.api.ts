import { Warehouse, NewWarehouse, StockLot, NewStockLot } from '@/domain/types';
import { supabase } from './client';

export const EXPIRED_WAREHOUSE_ID = 999; // Use a high number that won't conflict with actual warehouse IDs

export const warehouseApi = {
  getAll: async (_token: string): Promise<Warehouse[]> => {
    const { data, error } = await supabase.from('warehouses').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Warehouse | undefined> => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('warehouse_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewWarehouse): Promise<Warehouse> => {
    const { data, error } = await supabase.from('warehouses').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewWarehouse>
  ): Promise<Warehouse | undefined> => {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('warehouse_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('warehouses').delete().eq('warehouse_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

const baseStockLotApi = {
  getAll: async (_token: string): Promise<StockLot[]> => {
    const { data, error } = await supabase.from('stock_lots').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<StockLot | undefined> => {
    const { data, error } = await supabase.from('stock_lots').select('*').eq('lot_id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewStockLot): Promise<StockLot> => {
    const { data, error } = await supabase.from('stock_lots').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewStockLot>
  ): Promise<StockLot | undefined> => {
    const { data, error } = await supabase
      .from('stock_lots')
      .update(updates)
      .eq('lot_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('stock_lots').delete().eq('lot_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const stockLotApi = {
  ...baseStockLotApi,
  getByProductAndWarehouse: async (
    _token: string,
    productId: number,
    warehouseId: number
  ): Promise<StockLot[]> => {
    const { data, error } = await supabase
      .from('stock_lots')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
  processExpired: async (_token: string): Promise<{ movedCount: number }> => {
    const { data: lots, error } = await supabase.from('stock_lots').select('*');
    if (error) throw new Error(error.message);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let movedCount = 0;

    for (const lot of lots || []) {
      if (
        lot.expiry_date &&
        new Date(lot.expiry_date) < today &&
        lot.warehouse_id !== EXPIRED_WAREHOUSE_ID
      ) {
        await supabase
          .from('stock_lots')
          .update({ warehouse_id: EXPIRED_WAREHOUSE_ID })
          .eq('lot_id', lot.lot_id);
        movedCount++;
      }
    }

    return { movedCount };
  },
};

// Export for use in other modules
export const getStockLots = async (_token: string): Promise<StockLot[]> => {
  const { data, error } = await supabase.from('stock_lots').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};
