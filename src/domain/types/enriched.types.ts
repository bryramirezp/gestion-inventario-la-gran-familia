import { Product, StockLot } from './index';

/**
 * Producto enriquecido con información relacionada (categoría, marca, unidad, stock)
 * Usado en la API de productos para retornar información completa
 */
export interface EnrichedProduct extends Product {
  category_name: string;
  brand_name: string;
  unit_abbreviation: string;
  total_stock: number;
  lots: StockLot[];
  soonest_expiry_date: string | null;
  days_to_expiry: number | null;
}

