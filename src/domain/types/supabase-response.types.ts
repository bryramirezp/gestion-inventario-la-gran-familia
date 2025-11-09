import { Database } from './common.types';

// Tipos base de las tablas
type DonationTransactionRow = Database['public']['Tables']['donation_transactions']['Row'];
type DonationItemRow = Database['public']['Tables']['donation_items']['Row'];
// Kitchen module removed - transactions types no longer used
// type TransactionRow = Database['public']['Tables']['transactions']['Row'];
// type TransactionDetailRow = Database['public']['Tables']['transaction_details']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type DonorRow = Database['public']['Tables']['donors']['Row'];
type WarehouseRow = Database['public']['Tables']['warehouses']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type BrandRow = Database['public']['Tables']['brands']['Row'];
type UnitRow = Database['public']['Tables']['units']['Row'];

// Tipos para respuestas de Supabase con relaciones (JOINs)

// Respuesta de donation_transactions con relaciones
export interface SupabaseDonationTransactionResponse extends DonationTransactionRow {
  donor?: DonorRow | DonorRow[];
  warehouse?: WarehouseRow | WarehouseRow[];
  donation_items?: Array<
    DonationItemRow & {
      product?: ProductRow | ProductRow[];
    }
  >;
}

// Kitchen module removed - SupabaseTransactionResponse no longer used
// export interface SupabaseTransactionResponse extends TransactionRow {
//   transaction_details?: Array<TransactionDetailRow>;
// }

// Respuesta de products con relaciones
export interface SupabaseProductResponse extends ProductRow {
  category?: CategoryRow | CategoryRow[];
  brand?: BrandRow | BrandRow[];
  unit?: UnitRow | UnitRow[];
}

// Tipo helper para extraer un único objeto de una relación (puede venir como objeto único o array)
export type ExtractRelation<T> = T extends (infer U)[] ? U : T;

// Tipo helper para errores de API
export interface ApiError extends Error {
  message: string;
  status?: number;
  code?: string;
}

// Tipo helper para errores de Supabase
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

