import { Database } from './common.types';

export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type NewWarehouse = Database['public']['Tables']['warehouses']['Insert'];

export type StockLot = Database['public']['Tables']['stock_lots']['Row'];
export type NewStockLot = Database['public']['Tables']['stock_lots']['Insert'];

export type MovementType = Database['public']['Tables']['movement_types']['Row'];
export type NewMovementType = Database['public']['Tables']['movement_types']['Insert'];

export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type NewStockMovement = Database['public']['Tables']['stock_movements']['Insert'];

export type StockTransfer = Database['public']['Tables']['stock_transfers']['Row'];
export type NewStockTransfer = Database['public']['Tables']['stock_transfers']['Insert'];

export type InventoryAdjustment = Database['public']['Tables']['inventory_adjustments']['Row'];
export type NewInventoryAdjustment = Database['public']['Tables']['inventory_adjustments']['Insert'];

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MovementCategory = 'ENTRADA' | 'SALIDA' | 'TRASPASO' | 'AJUSTE';

export interface StockMovementWithType extends StockMovement {
  movement_type?: MovementType;
  lot?: StockLot & {
    product?: {
      product_id: number;
      product_name: string;
      sku: string | null;
    };
  };
}

export interface StockTransferWithDetails extends StockTransfer {
  lot?: StockLot;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  requested_by_user?: { user_id: string; full_name: string | null };
  approved_by_user?: { user_id: string; full_name: string | null };
}

export interface InventoryAdjustmentWithDetails extends InventoryAdjustment {
  lot?: StockLot;
  created_by_user?: { user_id: string; full_name: string | null };
  approved_by_user?: { user_id: string; full_name: string | null };
  rejected_by_user?: { user_id: string; full_name: string | null };
}