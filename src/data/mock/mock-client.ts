import { Session, User } from '@supabase/supabase-js';

const MOCK_USER: User = {
  id: 'mock-admin-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'user@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Administrador de Prueba', role: 'Administrador' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
  user: MOCK_USER,
};

const MOCK_DATA: Record<string, any[]> = {
  products: [
    { product_id: 1, product_name: 'Arroz 1kg', sku: 'ARR-001', category_id: 1, brand_id: 1, official_unit_id: 1, low_stock_threshold: 10, created_at: new Date().toISOString() },
    { product_id: 2, product_name: 'Aceite 1L', sku: 'ACE-001', category_id: 1, brand_id: 2, official_unit_id: 2, low_stock_threshold: 5, created_at: new Date().toISOString() },
    { product_id: 3, product_name: 'Leche en polvo 400g', sku: 'LEC-001', category_id: 1, brand_id: 3, official_unit_id: 3, low_stock_threshold: 15, created_at: new Date().toISOString() },
    { product_id: 4, product_name: 'Harina de Trigo 1kg', sku: 'HAR-001', category_id: 1, brand_id: 1, official_unit_id: 1, low_stock_threshold: 20, created_at: new Date().toISOString() },
    { product_id: 5, product_name: 'Pasta 500g', sku: 'PAS-001', category_id: 1, brand_id: 2, official_unit_id: 3, low_stock_threshold: 10, created_at: new Date().toISOString() },
    { product_id: 6, product_name: 'Frijoles Negros 1kg', sku: 'FRI-001', category_id: 1, brand_id: 3, official_unit_id: 1, low_stock_threshold: 20, created_at: new Date().toISOString() },
    { product_id: 7, product_name: 'Jabón Líquido 1L', sku: 'JAB-001', category_id: 2, brand_id: 2, official_unit_id: 2, low_stock_threshold: 10, created_at: new Date().toISOString() },
  ],
  categories: [
    { category_id: 1, category_name: 'Alimentos', is_active: true },
    { category_id: 2, category_name: 'Limpieza', is_active: true },
    { category_id: 3, category_name: 'Medicamentos', is_active: true },
  ],
  brands: [
    { brand_id: 1, brand_name: 'Marca A', is_active: true },
    { brand_id: 2, brand_name: 'Marca B', is_active: true },
    { brand_id: 3, brand_name: 'Marca C', is_active: true },
  ],
  units: [
    { unit_id: 1, unit_name: 'Kilogramo', abbreviation: 'kg', is_active: true },
    { unit_id: 2, unit_name: 'Litro', abbreviation: 'L', is_active: true },
    { unit_id: 3, unit_name: 'Unidad', abbreviation: 'un', is_active: true },
  ],
  donor_types: [
    { donor_type_id: 1, type_name: 'Individual', description: 'Persona natural' },
    { donor_type_id: 2, type_name: 'Corporativo', description: 'Empresa o institución' },
  ],
  warehouses: [
    { warehouse_id: 1, warehouse_name: 'Almacén Central', location_description: 'Sede Principal', is_active: true },
    { warehouse_id: 2, warehouse_name: 'Almacén Norte', location_description: 'Zona Norte', is_active: true },
    { warehouse_id: 3, warehouse_name: 'Almacén Sur', location_description: 'Zona Sur', is_active: true },
    { warehouse_id: 4, warehouse_name: 'Almacén Vacío', location_description: 'Sin stock', is_active: true },
  ],
  stock_lots: [
    { lot_id: 1, product_id: 1, warehouse_id: 1, current_quantity: 100, expiry_date: '2026-12-31', is_expired: false, unit_price: 1.5 },
    { lot_id: 2, product_id: 1, warehouse_id: 2, current_quantity: 50, expiry_date: '2026-12-31', is_expired: false, unit_price: 1.5 },
    { lot_id: 3, product_id: 2, warehouse_id: 1, current_quantity: 80, expiry_date: '2026-06-30', is_expired: false, unit_price: 3.2 },
    { lot_id: 4, product_id: 3, warehouse_id: 2, current_quantity: 200, expiry_date: '2026-01-10', is_expired: false, unit_price: 4.5 },
    { lot_id: 5, product_id: 4, warehouse_id: 1, current_quantity: 10, expiry_date: '2025-12-31', is_expired: false, unit_price: 1.2 },
    { lot_id: 6, product_id: 6, warehouse_id: 1, current_quantity: 5, expiry_date: '2026-05-20', is_expired: false, unit_price: 2.0 }, // Low stock
    { lot_id: 7, product_id: 7, warehouse_id: 3, current_quantity: 100, expiry_date: '2027-01-01', is_expired: false, unit_price: 5.0 },
  ],
  stock_movements: [
    { movement_id: 1, lot_id: 1, quantity: 100, movement_type_id: 1, created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 2, lot_id: 3, quantity: 80, movement_type_id: 1, created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 3, lot_id: 1, quantity: 5, movement_type_id: 5, created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 4, lot_id: 1, quantity: 20, movement_type_id: 3, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 5, lot_id: 2, quantity: 20, movement_type_id: 4, created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 6, lot_id: 6, quantity: 5, movement_type_id: 1, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 7, lot_id: 7, quantity: 100, movement_type_id: 1, created_at: new Date().toISOString() },
    { movement_id: 8, lot_id: 4, quantity: 10, movement_type_id: 2, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { movement_id: 9, lot_id: 5, quantity: 2, movement_type_id: 2, created_at: new Date().toISOString() },
  ],
  donation_transactions: [
    { donation_id: 1, donor_id: 1, warehouse_id: 1, donation_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], market_value: 150.00, actual_value: 150.00 },
    { donation_id: 2, donor_id: 2, warehouse_id: 1, donation_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], market_value: 300.00, actual_value: 300.00 },
    { donation_id: 3, donor_id: 1, warehouse_id: 2, donation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], market_value: 200.00, actual_value: 200.00 },
    { donation_id: 4, donor_id: 3, warehouse_id: 3, donation_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], market_value: 500.00, actual_value: 500.00 },
  ],
  donation_items: [
    { item_id: 1, donation_id: 1, product_id: 1, quantity: 100, market_unit_price: 1.5, actual_unit_price: 1.5 },
    { item_id: 2, donation_id: 2, product_id: 2, quantity: 50, market_unit_price: 3.0, actual_unit_price: 3.0 },
    { item_id: 3, donation_id: 2, product_id: 5, quantity: 50, market_unit_price: 3.0, actual_unit_price: 3.0 },
    { item_id: 4, donation_id: 3, product_id: 3, quantity: 40, market_unit_price: 5.0, actual_unit_price: 5.0 },
    { item_id: 5, donation_id: 4, product_id: 7, quantity: 50, market_unit_price: 5.0, actual_unit_price: 5.0 },
    { item_id: 6, donation_id: 4, product_id: 6, quantity: 125, market_unit_price: 2.0, actual_unit_price: 2.0 },
  ],
  movement_types: [
    { movement_type_id: 1, type_name: 'Entrada por Donación', is_positive: true, category: 'ENTRADA' },
    { movement_type_id: 2, type_name: 'Salida por Consumo', is_positive: false, category: 'SALIDA' },
    { movement_type_id: 3, type_name: 'Traspaso (Salida)', is_positive: false, category: 'TRASPASO' },
    { movement_type_id: 4, type_name: 'Traspaso (Entrada)', is_positive: true, category: 'TRASPASO' },
    { movement_type_id: 5, type_name: 'Ajuste de Inventario', is_positive: true, category: 'AJUSTE' },
  ],
  inventory_adjustments: [
    { adjustment_id: 1, lot_id: 1, quantity_before: 100, quantity_after: 95, reason: 'Merma natural', status: 'APPROVED', created_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { adjustment_id: 2, lot_id: 2, quantity_before: 50, quantity_after: 48, reason: 'Conteo cíclico', status: 'PENDING', created_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { adjustment_id: 3, lot_id: 3, quantity_before: 200, quantity_after: 190, reason: 'Daño en almacén', status: 'REJECTED', created_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { adjustment_id: 4, lot_id: 4, quantity_before: 75, quantity_after: 70, reason: 'Vencimiento próximo', status: 'APPROVED', created_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { adjustment_id: 5, lot_id: 5, quantity_before: 30, quantity_after: 25, reason: 'Ajuste de inventario', status: 'PENDING', created_by: 'mock-admin-id', created_at: new Date().toISOString() },
  ],
  stock_transfers: [
    { transfer_id: 1, lot_id: 1, from_warehouse_id: 1, to_warehouse_id: 2, quantity: 20, status: 'COMPLETED', requested_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { transfer_id: 2, lot_id: 3, from_warehouse_id: 1, to_warehouse_id: 3, quantity: 15, status: 'PENDING', requested_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { transfer_id: 3, lot_id: 2, from_warehouse_id: 2, to_warehouse_id: 1, quantity: 10, status: 'REJECTED', requested_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { transfer_id: 4, lot_id: 4, from_warehouse_id: 1, to_warehouse_id: 4, quantity: 50, status: 'COMPLETED', requested_by: 'mock-admin-id', approved_by: 'mock-admin-id', created_at: new Date().toISOString() },
    { transfer_id: 5, lot_id: 5, from_warehouse_id: 3, to_warehouse_id: 2, quantity: 5, status: 'PENDING', requested_by: 'mock-admin-id', created_at: new Date().toISOString() },
  ],
  donors: [
    { donor_id: 1, donor_name: 'Juan Pérez', donor_type_id: 1, email: 'juan@example.com' },
    { donor_id: 2, donor_name: 'Empresa XYZ', donor_type_id: 2, email: 'contacto@xyz.com' },
    { donor_id: 3, donor_name: 'María López', donor_type_id: 1, email: 'maria@example.com' },
  ],
  users: [
    { user_id: 'mock-admin-id', full_name: 'Administrador de Prueba', role_id: 1, is_active: true }
  ],
  roles: [
    { role_id: 1, role_name: 'Administrador' }
  ],
  user_warehouse_access: [
    { user_id: 'mock-admin-id', warehouse_id: 1 },
    { user_id: 'mock-admin-id', warehouse_id: 2 },
    { user_id: 'mock-admin-id', warehouse_id: 3 },
    { user_id: 'mock-admin-id', warehouse_id: 4 }
  ]
};

class MockQueryBuilder {
  private table: string;
  private isSingle: boolean = false;
  private filters: Array<(item: any) => boolean> = [];

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(item => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(item => item[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(item => item[column] > value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(item => item[column] < value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(item => item[column] >= value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(item => item[column] <= value);
    return this;
  }

  like(column: string, pattern: string) {
    return this;
  }

  ilike(column: string, pattern: string) {
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push(item => values.includes(item[column]));
    return this;
  }

  order(column: string, options?: any) {
    return this;
  }

  limit(count: number) {
    return this;
  }

  insert(values: any) {
    return this;
  }

  update(values: any) {
    return this;
  }

  delete() {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any) {
    let data = [...(MOCK_DATA[this.table] || [])];
    
    // Aplicar filtros
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // Simular JOINs para productos
    if (this.table === 'products') {
      data = data.map(p => ({
        ...p,
        category: MOCK_DATA.categories.find(c => c.category_id === p.category_id),
        brand: MOCK_DATA.brands.find(b => b.brand_id === p.brand_id),
        unit: MOCK_DATA.units.find(u => u.unit_id === p.official_unit_id)
      }));
    }

    // Simular JOINs para usuarios
    if (this.table === 'users') {
      data = data.map(u => ({
        ...u,
        role: MOCK_DATA.roles.find(r => r.role_id === u.role_id)
      }));
    }

    // Simular JOINs para donaciones
    if (this.table === 'donation_transactions') {
      data = data.map(d => ({
        ...d,
        donor: MOCK_DATA.donors.find(donor => donor.donor_id === d.donor_id),
        warehouse: MOCK_DATA.warehouses.find(w => w.warehouse_id === d.warehouse_id),
        items: MOCK_DATA.donation_items.filter(i => i.donation_id === d.donation_id).map(i => ({
          ...i,
          product: MOCK_DATA.products.find(p => p.product_id === i.product_id)
        }))
      }));
    }

    // Simular JOINs para donantes
    if (this.table === 'donors') {
      data = data.map(d => ({
        ...d,
        donor_type: MOCK_DATA.donor_types.find(dt => dt.donor_type_id === d.donor_type_id)
      }));
    }

    // Simular JOINs para movimientos de stock
    if (this.table === 'stock_movements') {
      data = data.map(m => ({
        ...m,
        movement_type: MOCK_DATA.movement_types.find(mt => mt.movement_type_id === m.movement_type_id),
        lot: (() => {
          const lot = MOCK_DATA.stock_lots.find(l => l.lot_id === m.lot_id);
          if (!lot) return null;
          return {
            ...lot,
            product: MOCK_DATA.products.find(p => p.product_id === lot.product_id)
          };
        })()
      }));
    }

    // Simular JOINs para ajustes de inventario
    if (this.table === 'inventory_adjustments') {
      data = data.map(a => ({
        ...a,
        lot: MOCK_DATA.stock_lots.find(l => l.lot_id === a.lot_id),
        created_by_user: MOCK_DATA.users.find(u => u.user_id === a.created_by),
        approved_by_user: a.approved_by ? MOCK_DATA.users.find(u => u.user_id === a.approved_by) : null,
        rejected_by_user: a.rejected_by ? MOCK_DATA.users.find(u => u.user_id === a.rejected_by) : null
      }));
    }

    // Simular JOINs para traspasos
    if (this.table === 'stock_transfers') {
      data = data.map(t => ({
        ...t,
        lot: MOCK_DATA.stock_lots.find(l => l.lot_id === t.lot_id),
        from_warehouse: MOCK_DATA.warehouses.find(w => w.warehouse_id === t.from_warehouse_id),
        to_warehouse: MOCK_DATA.warehouses.find(w => w.warehouse_id === t.to_warehouse_id),
        requested_by_user: MOCK_DATA.users.find(u => u.user_id === t.requested_by),
        approved_by_user: t.approved_by ? MOCK_DATA.users.find(u => u.user_id === t.approved_by) : null
      }));
    }

    const result = this.isSingle ? (data[0] || null) : data;
    resolve({ data: result, error: null, count: data.length });
  }
}

export const mockSupabase = {
  auth: {
    async signInWithPassword({ email, password }: any) {
      if (email === 'user@example.com' && password === 'Usuario123.') {
        localStorage.setItem('DEMO_MODE', 'true');
        return { data: { user: MOCK_USER, session: MOCK_SESSION }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Credenciales inválidas' } };
    },
    async getSession() {
      const isDemo = localStorage.getItem('DEMO_MODE') === 'true';
      return { data: { session: isDemo ? MOCK_SESSION : null }, error: null };
    },
    onAuthStateChange(callback: any) {
      const isDemo = localStorage.getItem('DEMO_MODE') === 'true';
      if (isDemo) {
        callback('SIGNED_IN', MOCK_SESSION);
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    async signOut() {
      localStorage.removeItem('DEMO_MODE');
      window.location.href = '/landing';
      return { error: null };
    },
    async getUser() {
      const isDemo = localStorage.getItem('DEMO_MODE') === 'true';
      return { data: { user: isDemo ? MOCK_USER : null }, error: null };
    }
  },
  from(table: string) {
    return new MockQueryBuilder(table);
  },
  rpc(name: string, args?: any) {
    return {
      async then(resolve: any) {
        resolve({ data: null, error: null });
      }
    };
  },
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: { path: 'mock-path' }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: 'https://placeholder.com/mock.png' } }),
      remove: async () => ({ data: [], error: null }),
      list: async () => ({ data: [], error: null }),
    })
  }
} as any;
