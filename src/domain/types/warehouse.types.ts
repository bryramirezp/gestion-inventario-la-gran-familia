import { Database } from './common.types';

export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type NewWarehouse = Database['public']['Tables']['warehouses']['Insert'];

export type StockLot = Database['public']['Tables']['stock_lots']['Row'];
export type NewStockLot = Database['public']['Tables']['stock_lots']['Insert'];
