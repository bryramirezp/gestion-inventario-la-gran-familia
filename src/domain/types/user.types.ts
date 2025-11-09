import { Database } from './common.types';

export type User = Database['public']['Tables']['users']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type UserWarehouseAccess = Database['public']['Tables']['user_warehouse_access']['Row'];
