import { Database } from './common.types';
import { NewStockLot, StockLot } from './warehouse.types';

export type DonationTransaction = Database['public']['Tables']['donation_transactions']['Row'];

export interface DonationItem extends NewStockLot {
  item_id?: number;
  donation_id?: number;
  market_unit_price: number;
  actual_unit_price: number;
  // Campos enriquecidos (agregados por las APIs)
  product_name?: string;
  // Lotes de stock asociados a este item de donación
  stock_lots?: StockLot[];
}

export interface Donation {
  donation_id: number;
  donor_id: number;
  warehouse_id: number;
  donation_date: string;
  items: DonationItem[];
  // Enriched data
  donor_name?: string;
  warehouse_name?: string;
  market_value?: number;
  actual_value?: number;
}

export interface NewDonation {
  donor_id: number;
  warehouse_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    expiry_date: string | null;
    market_unit_price: number;
    actual_unit_price: number;
  }>;
}
