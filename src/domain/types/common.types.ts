export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      warehouses: {
        Row: {
          warehouse_id: number;
          warehouse_name: string;
          location_description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          warehouse_id?: number;
          warehouse_name: string;
          location_description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          warehouse_id?: number;
          warehouse_name?: string;
          location_description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      users: {
        Row: {
          user_id: string;
          full_name: string | null;
          role_id: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          role_id?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          role_id?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['role_id'];
          },
        ];
      };

      user_warehouse_access: {
        Row: {
          user_id: string;
          warehouse_id: number;
        };
        Insert: {
          user_id: string;
          warehouse_id: number;
        };
        Update: {
          user_id?: string;
          warehouse_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_warehouse_access_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'user_warehouse_access_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['warehouse_id'];
          },
        ];
      };

      roles: {
        Row: {
          role_id: number;
          role_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          role_id?: number;
          role_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role_id?: number;
          role_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      categories: {
        Row: {
          category_id: number;
          category_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category_id?: number;
          category_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: number;
          category_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      transaction_types: {
        Row: {
          type_id: number;
          type_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          type_id?: number;
          type_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          type_id?: number;
          type_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      units: {
        Row: {
          unit_id: number;
          unit_name: string;
          abbreviation: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          unit_id?: number;
          unit_name: string;
          abbreviation: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          unit_id?: number;
          unit_name?: string;
          abbreviation?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      brands: {
        Row: {
          brand_id: number;
          brand_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: number;
          brand_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: number;
          brand_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      donor_types: {
        Row: {
          donor_type_id: number;
          type_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          donor_type_id?: number;
          type_name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          donor_type_id?: number;
          type_name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      donors: {
        Row: {
          donor_id: number;
          donor_name: string;
          donor_type_id: number;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          donor_id?: number;
          donor_name: string;
          donor_type_id: number;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          donor_id?: number;
          donor_name?: string;
          donor_type_id?: number;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'donors_donor_type_id_fkey';
            columns: ['donor_type_id'];
            isOneToOne: false;
            referencedRelation: 'donor_types';
            referencedColumns: ['donor_type_id'];
          },
        ];
      };

      donation_items: {
        Row: {
          item_id: number;
          donation_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
          discount_percentage: number;
          expiry_date: string | null;
          created_at: string;
        };
        Insert: {
          item_id?: number;
          donation_id: number;
          product_id: number;
          quantity: number;
          unit_price: number;
          discount_percentage?: number;
          expiry_date?: string | null;
          created_at?: string;
        };
        Update: {
          item_id?: number;
          donation_id?: number;
          product_id?: number;
          quantity?: number;
          unit_price?: number;
          discount_percentage?: number;
          expiry_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'donation_items_donation_id_fkey';
            columns: ['donation_id'];
            isOneToOne: false;
            referencedRelation: 'donation_transactions';
            referencedColumns: ['donation_id'];
          },
          {
            foreignKeyName: 'donation_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
        ];
      };

      donation_transactions: {
        Row: {
          donation_id: number;
          donor_id: number;
          warehouse_id: number;
          donation_date: string;
          total_value_before_discount: number;
          total_value_after_discount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          donation_id?: number;
          donor_id: number;
          warehouse_id: number;
          donation_date?: string;
          total_value_before_discount?: number;
          total_value_after_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          donation_id?: number;
          donor_id?: number;
          warehouse_id?: number;
          donation_date?: string;
          total_value_before_discount?: number;
          total_value_after_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'donation_transactions_donor_id_fkey';
            columns: ['donor_id'];
            isOneToOne: false;
            referencedRelation: 'donors';
            referencedColumns: ['donor_id'];
          },
          {
            foreignKeyName: 'donation_transactions_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['warehouse_id'];
          },
        ];
      };

      products: {
        Row: {
          product_id: number;
          product_name: string;
          sku: string | null;
          description: string | null;
          category_id: number;
          brand_id: number | null;
          official_unit_id: number;
          low_stock_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id?: number;
          product_name: string;
          sku?: string | null;
          description?: string | null;
          category_id: number;
          brand_id?: number | null;
          official_unit_id: number;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: number;
          product_name?: string;
          sku?: string | null;
          description?: string | null;
          category_id?: number;
          brand_id?: number | null;
          official_unit_id?: number;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['category_id'];
          },
          {
            foreignKeyName: 'products_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['brand_id'];
          },
          {
            foreignKeyName: 'products_official_unit_id_fkey';
            columns: ['official_unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['unit_id'];
          },
        ];
      };

      stock_lots: {
        Row: {
          lot_id: number;
          product_id: number;
          warehouse_id: number;
          current_quantity: number;
          received_date: string;
          expiry_date: string | null;
          is_expired: boolean;
          unit_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          lot_id?: number;
          product_id: number;
          warehouse_id: number;
          current_quantity: number;
          received_date?: string;
          expiry_date?: string | null;
          is_expired?: boolean;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          lot_id?: number;
          product_id?: number;
          warehouse_id?: number;
          current_quantity?: number;
          received_date?: string;
          expiry_date?: string | null;
          is_expired?: boolean;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_lots_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
          {
            foreignKeyName: 'stock_lots_warehouse_id_fkey';
            columns: ['warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['warehouse_id'];
          },
        ];
      };

      transactions: {
        Row: {
          transaction_id: number;
          requester_id: string;
          approver_id: string | null;
          transaction_date: string;
          status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
          notes: string | null;
          source_warehouse_id: number;
          requester_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          transaction_id?: number;
          requester_id: string;
          approver_id?: string | null;
          transaction_date?: string;
          status?: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
          notes?: string | null;
          source_warehouse_id: number;
          requester_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          transaction_id?: number;
          requester_id?: string;
          approver_id?: string | null;
          transaction_date?: string;
          status?: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
          notes?: string | null;
          source_warehouse_id?: number;
          requester_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'transactions_approver_id_fkey';
            columns: ['approver_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'transactions_source_warehouse_id_fkey';
            columns: ['source_warehouse_id'];
            isOneToOne: false;
            referencedRelation: 'warehouses';
            referencedColumns: ['warehouse_id'];
          },
        ];
      };

      transaction_details: {
        Row: {
          detail_id: number;
          transaction_id: number;
          product_id: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          detail_id?: number;
          transaction_id: number;
          product_id: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          detail_id?: number;
          transaction_id?: number;
          product_id?: number;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_details_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['transaction_id'];
          },
          {
            foreignKeyName: 'transaction_details_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['product_id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
