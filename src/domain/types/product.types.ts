import { Database } from './common.types';

export type Product = Database['public']['Tables']['products']['Row'];
export type NewProduct = Database['public']['Tables']['products']['Insert'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type NewCategory = Database['public']['Tables']['categories']['Insert'];

export type Brand = Database['public']['Tables']['brands']['Row'];
export type NewBrand = Database['public']['Tables']['brands']['Insert'];

export type Unit = Database['public']['Tables']['units']['Row'];
