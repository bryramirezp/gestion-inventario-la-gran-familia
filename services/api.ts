import {
  Product,
  NewProduct,
  Warehouse,
  NewWarehouse,
  Category,
  NewCategory,
  Brand,
  NewBrand,
  Donor,
  NewDonor,
  NewDonation,
  Donation,
  DonorAnalysisData,
  Unit,
  DonorType,
  StockLot,
  NewStockLot,
  User,
  Role,
  Transaction,
  NewTransaction,
  TransactionDetail,
  NewTransactionDetail,
  Menu,
  NewMenu,
} from '../types';
import { supabase } from './supabase';

const EXPIRED_WAREHOUSE_ID = 4;

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
export const categoryApi = {
  getAll: async (_token: string): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Category | undefined> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('category_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewCategory): Promise<Category> => {
    const { data, error } = await supabase.from('categories').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewCategory>
  ): Promise<Category | undefined> => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('category_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('categories').delete().eq('category_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
export const brandApi = {
  getAll: async (_token: string): Promise<Brand[]> => {
    const { data, error } = await supabase.from('brands').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Brand | undefined> => {
    const { data, error } = await supabase.from('brands').select('*').eq('brand_id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewBrand): Promise<Brand> => {
    const { data, error } = await supabase.from('brands').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewBrand>
  ): Promise<Brand | undefined> => {
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('brand_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('brands').delete().eq('brand_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
export const menuApi = {
  getAll: async (_token: string): Promise<Menu[]> => {
    const { data, error } = await supabase.from('daily_menus').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Menu | undefined> => {
    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('menu_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewMenu): Promise<Menu> => {
    const { data, error } = await supabase.from('daily_menus').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewMenu>
  ): Promise<Menu | undefined> => {
    const { data, error } = await supabase
      .from('daily_menus')
      .update(updates)
      .eq('menu_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('daily_menus').delete().eq('menu_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

const baseDonorApi = {
  getAll: async (_token: string): Promise<Donor[]> => {
    const { data, error } = await supabase.from('donors').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Donor | undefined> => {
    const { data, error } = await supabase.from('donors').select('*').eq('donor_id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewDonor): Promise<Donor> => {
    const { data, error } = await supabase.from('donors').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewDonor>
  ): Promise<Donor | undefined> => {
    const { data, error } = await supabase
      .from('donors')
      .update(updates)
      .eq('donor_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('donors').delete().eq('donor_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

const getDonorAnalysisData = async (
  token: string,
  donors: Donor[],
  transactions: Donation[]
): Promise<DonorAnalysisData[]> => {
  const [products, categories] = await Promise.all([
    productApi.getAll(token),
    categoryApi.getAll(token),
  ]);

  const productMap = new Map(products.map((p) => [p.product_id, { category_id: p.category_id }]));
  const categoryMap = new Map(categories.map((c) => [c.category_id, c.category_name]));

  const grandTotalValue = transactions.reduce(
    (sum, t) => sum + (t.total_value_after_discount || 0),
    0
  );

  const analysis = donors.map((donor) => {
    const donorTransactions = transactions.filter((t) => t.donor_id === donor.donor_id);

    if (donorTransactions.length === 0) {
      return {
        ...donor,
        total_donations_count: 0,
        total_value_donated: 0,
        average_donation_value: 0,
        last_donation_date: null,
        top_donated_category: 'N/A',
        contribution_percentage: 0,
      };
    }

    const total_value_donated = donorTransactions.reduce(
      (sum, t) => sum + (t.total_value_after_discount || 0),
      0
    );

    const categoryCounts: Record<string, number> = {};
    donorTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const productInfo = productMap.get(item.product_id);
        if (productInfo) {
          const categoryName = categoryMap.get(productInfo.category_id);
          if (categoryName) {
            categoryCounts[categoryName] =
              (categoryCounts[categoryName] || 0) + item.current_quantity;
          }
        }
      });
    });

    return {
      ...donor,
      total_donations_count: donorTransactions.length,
      total_value_donated,
      average_donation_value: total_value_donated / donorTransactions.length,
      last_donation_date: donorTransactions.sort(
        (a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime()
      )[0].donation_date,
      contribution_percentage:
        grandTotalValue > 0 ? (total_value_donated / grandTotalValue) * 100 : 0,
      top_donated_category:
        Object.keys(categoryCounts).length > 0
          ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A',
    };
  });

  return analysis;
};

export const donorApi = {
  ...baseDonorApi,
  getAnalysis: async (token: string): Promise<DonorAnalysisData[]> => {
    const [donors, transactions] = await Promise.all([
      baseDonorApi.getAll(token),
      donationApi.getHistory(token),
    ]);
    const analysis = await getDonorAnalysisData(token, donors, transactions);
    return analysis;
  },
  getByIdWithDetails: async (
    token: string,
    id: number
  ): Promise<{ donor: Donor; analysis: DonorAnalysisData; donations: Donation[] } | null> => {
    const [donor, allDonors, allTransactions] = await Promise.all([
      baseDonorApi.getById(token, id),
      baseDonorApi.getAll(token),
      donationApi.getHistory(token),
    ]);

    if (!donor) return null;

    const analysisData = await getDonorAnalysisData(token, allDonors, allTransactions);
    const donorAnalysis = analysisData.find((d) => d.donor_id === id);
    const donorDonations = allTransactions.filter((t) => t.donor_id === id);

    return { donor, analysis: donorAnalysis!, donations: donorDonations };
  },
};

export const productApi = {
  getAll: async (_token: string): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Product | undefined> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewProduct): Promise<Product> => {
    const { data, error } = await supabase.from('products').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewProduct>
  ): Promise<Product | undefined> => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('product_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('products').delete().eq('product_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
export const transactionApi = {
  getAll: async (_token: string): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Transaction | undefined> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewTransaction): Promise<Transaction> => {
    const { data, error } = await supabase.from('transactions').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewTransaction>
  ): Promise<Transaction | undefined> => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('transaction_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('transactions').delete().eq('transaction_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
export const transactionDetailApi = {
  getAll: async (_token: string): Promise<TransactionDetail[]> => {
    const { data, error } = await supabase.from('transaction_details').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<TransactionDetail | undefined> => {
    const { data, error } = await supabase
      .from('transaction_details')
      .select('*')
      .eq('detail_id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewTransactionDetail): Promise<TransactionDetail> => {
    const { data, error } = await supabase
      .from('transaction_details')
      .insert(newItem)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewTransactionDetail>
  ): Promise<TransactionDetail | undefined> => {
    const { data, error } = await supabase
      .from('transaction_details')
      .update(updates)
      .eq('detail_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('transaction_details').delete().eq('detail_id', id);
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

// --- AUTH & USER API ---
export const authApi = {
  login: async (
    email: string,
    _password?: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (userError || !user) throw new Error('Usuario no encontrado');
    if (!user.is_active) throw new Error('Tu cuenta ha sido suspendida.');

    // TODO: Add password verification here when authentication is properly implemented
    // For now, accept any password for demo purposes

    const { data: role } = await supabase
      .from('roles')
      .select('*')
      .eq('role_id', user.role_id)
      .single();

    const { data: warehouseAccess } = await supabase
      .from('user_warehouse_access')
      .select('warehouse_id')
      .eq('user_id', user.user_id);

    return { accessToken: 'managed-by-supabase', refreshToken: 'managed-by-supabase' };
  },
  refreshToken: async (_token: string): Promise<{ accessToken: string; refreshToken: string }> => {
    throw new Error('Token refresh handled automatically by Supabase');
  },
  logout: async (_token: string): Promise<{ success: boolean }> => {
    return { success: true };
  },
  getLoginOptions: async (): Promise<User[]> => {
    // Return empty array since we now use email login
    return [];
  },
};

export const userApi = {
  getAllWithDetails: async (_token: string) => {
    const [usersRes, rolesRes, accessRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('roles').select('*'),
      supabase.from('user_warehouse_access').select('*'),
    ]);
    if (usersRes.error) throw new Error(usersRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (accessRes.error) throw new Error(accessRes.error.message);

    const users = usersRes.data || [];
    const roles = rolesRes.data || [];
    const access = accessRes.data || [];
    const rolesMap = new Map(roles.map((r) => [r.role_id, r.role_name]));

    const detailedUsers = users.map((user) => {
      const userAccess = access
        .filter((a) => a.user_id === user.user_id)
        .map((a) => a.warehouse_id);
      return {
        ...user,
        role_name: rolesMap.get(user.role_id) || 'N/A',
        warehouse_access: userAccess,
      };
    });
    return detailedUsers;
  },
  create: async (
    token: string,
    userData: { full_name: string; role_id: number; warehouse_ids: number[] }
  ): Promise<User> => {
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('full_name')
      .ilike('full_name', userData.full_name);
    if (checkError) throw new Error(checkError.message);
    if (existingUsers && existingUsers.length > 0)
      throw new Error('A user with this name already exists.');

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        full_name: userData.full_name,
        role_id: userData.role_id,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    for (const whId of userData.warehouse_ids) {
      await supabase
        .from('user_warehouse_access')
        .insert({ user_id: newUser.user_id, warehouse_id: whId });
    }

    return newUser;
  },
  updateProfile: async (
    token: string,
    userId: string,
    updates: { full_name: string }
  ): Promise<User | undefined> => {
    if (updates.full_name) {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('full_name')
        .ilike('full_name', updates.full_name)
        .neq('user_id', userId);
      if (checkError) throw new Error(checkError.message);
      if (existingUsers && existingUsers.length > 0)
        throw new Error('A user with this name already exists.');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  updateUserAccess: async (
    token: string,
    userId: string,
    role_id: number,
    warehouse_ids: number[]
  ): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('users')
      .update({ role_id })
      .eq('user_id', userId);
    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabase
      .from('user_warehouse_access')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw new Error(deleteError.message);

    for (const whId of warehouse_ids) {
      const { error: insertError } = await supabase
        .from('user_warehouse_access')
        .insert({ user_id: userId, warehouse_id: whId });
      if (insertError) throw new Error(insertError.message);
    }
    return true;
  },
  updateUserPassword: async (
    token: string,
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name')
      .eq('user_id', userId)
      .single();
    if (userError) throw new Error(userError.message);
    if (!user) throw new Error('User not found');
    // Note: In a real app, you'd hash and update the password in the database
    return true;
  },
  toggleUserStatus: async (token: string, userId: string): Promise<User> => {
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (selectError) throw new Error(selectError.message);
    if (!user) throw new Error('User not found');

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
export const getRoles = async (_token: string): Promise<Role[]> => {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

// --- CUSTOM API FUNCTIONS ---
export const getUnits = async (_token: string): Promise<Unit[]> => {
  const { data, error } = await supabase.from('units').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};
export const getDonorTypes = async (_token: string): Promise<DonorType[]> => {
  const { data, error } = await supabase.from('donor_types').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};
export const getStockLots = async (_token: string): Promise<StockLot[]> => {
  const { data, error } = await supabase.from('stock_lots').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const getFullProductDetails = async (_token: string, warehouseId?: number) => {
  const [products, categories, units, brands, stockLots] = await Promise.all([
    productApi.getAll(_token),
    categoryApi.getAll(_token),
    getUnits(_token),
    brandApi.getAll(_token),
    getStockLots(_token),
  ]);

  const categoriesMap = new Map(categories.map((c) => [c.category_id, c.category_name]));
  const brandsMap = new Map(brands.map((b) => [b.brand_id, b.brand_name]));
  const unitsMap = new Map(units.map((u) => [u.unit_id, u.abbreviation]));

  const relevantStockLots = warehouseId
    ? stockLots.filter((lot) => lot.warehouse_id === warehouseId)
    : stockLots;
  const lotsByProduct = relevantStockLots.reduce(
    (acc, lot) => {
      if (!acc[lot.product_id]) acc[lot.product_id] = [];
      acc[lot.product_id].push(lot);
      return acc;
    },
    {} as Record<number, StockLot[]>
  );

  return products.map((p) => {
    const productLots = lotsByProduct[p.product_id] || [];
    const usableLots = productLots.filter((lot) => lot.warehouse_id !== EXPIRED_WAREHOUSE_ID);

    const totalStock = usableLots.reduce((sum, lot) => sum + lot.current_quantity, 0);

    const soonestExpiry = usableLots
      .filter((l) => l.expiry_date)
      .map((l) => new Date(l.expiry_date!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    let daysToExpiry: number | null = null;
    if (soonestExpiry) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      daysToExpiry = Math.ceil((soonestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Return all lots, but calculated values are based on usable lots
    return {
      ...p,
      category_name: categoriesMap.get(p.category_id) || 'N/A',
      brand_name: p.brand_id ? brandsMap.get(p.brand_id) : 'N/A',
      unit_abbreviation: unitsMap.get(p.official_unit_id) || 'N/A',
      total_stock: totalStock,
      lots: productLots,
      soonest_expiry_date: soonestExpiry ? soonestExpiry.toISOString().split('T')[0] : null,
      days_to_expiry: daysToExpiry,
    };
  });
};

export const kitchenApi = {
  getTransactions: async (_token: string) => {
    const [transactionsRes, detailsRes, usersRes, productsRes] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('transaction_details').select('*'),
      supabase.from('users').select('*'),
      supabase.from('products').select('*'),
    ]);
    if (transactionsRes.error) throw new Error(transactionsRes.error.message);
    if (detailsRes.error) throw new Error(detailsRes.error.message);
    if (usersRes.error) throw new Error(usersRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);

    const transactions = transactionsRes.data || [];
    const details = detailsRes.data || [];
    const users = usersRes.data || [];
    const products = productsRes.data || [];

    const userMap = new Map(users.map((u) => [u.user_id, u.full_name]));
    const productMap = new Map(products.map((p) => [p.product_id, p.product_name]));

    return transactions
      .map((t) => ({
        ...t,
        requester_name: userMap.get(t.requester_id) || 'Unknown',
        approver_name: t.approver_id ? userMap.get(t.approver_id) : 'N/A',
        details: details
          .filter((d) => d.transaction_id === t.transaction_id)
          .map((d) => ({ ...d, product_name: productMap.get(d.product_id) || 'Unknown' })),
      }))
      .sort((a, b) => b.transaction_id - a.transaction_id);
  },
  createRequest: async (
    token: string,
    requester_id: string,
    source_warehouse_id: number,
    items: { product_id: number; quantity: number }[],
    notes: string,
    requester_signature: string
  ): Promise<Transaction> => {
    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert({
        requester_id,
        source_warehouse_id,
        notes,
        status: 'Pending',
        requester_signature,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    for (const item of items) {
      await supabase
        .from('transaction_details')
        .insert({ transaction_id: newTransaction.transaction_id, ...item });
    }
    return newTransaction;
  },
  updateRequestStatus: async (
    token: string,
    transaction_id: number,
    newStatus: Transaction['status'],
    approver_id?: string
  ): Promise<Transaction | undefined> => {
    const { data: transaction, error: selectError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();
    if (selectError || !transaction) throw new Error('Transaction not found');

    const updates: Partial<Pick<Transaction, 'status' | 'approver_id'>> = { status: newStatus };
    if (approver_id) updates.approver_id = approver_id;

    const { data: updated, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('transaction_id', transaction_id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (newStatus === 'Completed' && updated) {
      const { data: transactionDetails, error: detailsError } = await supabase
        .from('transaction_details')
        .select('*')
        .eq('transaction_id', transaction_id);
      if (detailsError) throw new Error(detailsError.message);

      for (const detail of transactionDetails || []) {
        const { data: lots, error: lotsError } = await supabase
          .from('stock_lots')
          .select('*')
          .eq('product_id', detail.product_id)
          .eq('warehouse_id', updated.source_warehouse_id)
          .gt('current_quantity', 0)
          .order('received_date', { ascending: true });
        if (lotsError) throw new Error(lotsError.message);

        let quantityToDeduct = detail.quantity;
        for (const lot of lots || []) {
          if (quantityToDeduct <= 0) break;
          const deductAmount = Math.min(lot.current_quantity, quantityToDeduct);
          await supabase
            .from('stock_lots')
            .update({ current_quantity: lot.current_quantity - deductAmount })
            .eq('lot_id', lot.lot_id);
          quantityToDeduct -= deductAmount;
        }
      }
    }
    return updated;
  },
};

export const donationApi = {
  createDonation: async (_token: string, donationData: NewDonation) => {
    for (const item of donationData.items) {
      await stockLotApi.create(_token, {
        product_id: item.product_id,
        warehouse_id: donationData.warehouse_id,
        current_quantity: item.quantity,
        expiry_date: item.expiry_date,
        unit_price: item.unit_price,
        received_date: new Date().toISOString(),
      });
    }
    const { data: newDonationRecord, error } = await supabase
      .from('donation_transactions')
      .insert({
        donor_id: donationData.donor_id,
        warehouse_id: donationData.warehouse_id,
        donation_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { success: true, donation: newDonationRecord };
  },
  getHistory: async (_token: string): Promise<Donation[]> => {
    const [donationsRes, donorsRes, warehousesRes, productsRes] = await Promise.all([
      supabase.from('donation_transactions').select('*'),
      supabase.from('donors').select('*'),
      supabase.from('warehouses').select('*'),
      supabase.from('products').select('*'),
    ]);
    if (donationsRes.error) throw new Error(donationsRes.error.message);
    if (donorsRes.error) throw new Error(donorsRes.error.message);
    if (warehousesRes.error) throw new Error(warehousesRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);

    const donations = donationsRes.data || [];
    const donorMap = new Map((donorsRes.data || []).map((d) => [d.donor_id, d.donor_name]));
    const warehouseMap = new Map(
      (warehousesRes.data || []).map((w) => [w.warehouse_id, w.warehouse_name])
    );
    const productMap = new Map((productsRes.data || []).map((p) => [p.product_id, p.product_name]));

    const enrichedHistory = donations.map((donation) => {
      const safeItems = donation.items || []; // Ensure items is an array

      const total_value_before_discount = safeItems.reduce(
        (acc, item) => acc + (item.unit_price || 0) * item.current_quantity,
        0
      );
      const total_value_after_discount = safeItems.reduce((acc, item) => {
        const itemTotal = (item.unit_price || 0) * item.current_quantity;
        const discount = itemTotal * ((item.discount_percentage || 0) / 100);
        return acc + (itemTotal - discount);
      }, 0);

      return {
        ...donation,
        donor_name: donorMap.get(donation.donor_id) || 'Unknown Donor',
        warehouse_name: warehouseMap.get(donation.warehouse_id) || 'Unknown Warehouse',
        items: safeItems.map((item) => ({
          ...item,
          product_name: productMap.get(item.product_id) || 'Unknown Product',
        })),
        total_value_before_discount,
        total_value_after_discount,
      };
    });

    return enrichedHistory.sort(
      (a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime()
    );
  },
};

// --- SYSTEM API ---
export const systemApi = {
  getDataForExport: async (_token: string, year: number) => {
    const [donations, donors, warehouses, products, units, stockLots, transactions, users] =
      await Promise.all([
        donationApi.getHistory(_token),
        donorApi.getAll(_token),
        warehouseApi.getAll(_token),
        productApi.getAll(_token),
        getUnits(_token),
        stockLotApi.getAll(_token),
        kitchenApi.getTransactions(_token),
        userApi.getAllWithDetails(_token),
      ]);

    const productMap = new Map(products.map((p) => [p.product_id, p]));
    const warehouseMap = new Map(warehouses.map((w) => [w.warehouse_id, w.warehouse_name]));

    // Filter data for the selected year
    const filteredDonations = donations.filter(
      (d) => new Date(d.donation_date).getFullYear() === year
    );
    const filteredStockLots = stockLots.filter(
      (s) => new Date(s.received_date).getFullYear() === year
    );
    const filteredTransactions = transactions.filter(
      (t) => new Date(t.transaction_date).getFullYear() === year
    );

    // Prepare data for sheets
    const donationSummary = filteredDonations.map((d) => ({
      'ID Donación': d.donation_id,
      Donante: d.donor_name,
      Almacén: d.warehouse_name,
      Fecha: new Date(d.donation_date).toLocaleDateString(),
      'Valor Total': d.total_value_after_discount,
    }));

    const donationItems = filteredDonations.flatMap((d) =>
      d.items.map((i) => ({
        'ID Donación': d.donation_id,
        Fecha: new Date(d.donation_date).toLocaleDateString(),
        Producto: (i as any).product_name,
        Cantidad: i.current_quantity,
        'Precio Unitario': i.unit_price,
        '% Descuento': i.discount_percentage,
      }))
    );

    const stockLotsData = filteredStockLots.map((s) => {
      const product = productMap.get(s.product_id);
      return {
        'ID Lote': s.lot_id,
        Producto: product?.product_name || 'N/A',
        SKU: product?.sku || 'N/A',
        Almacén: warehouseMap.get(s.warehouse_id) || 'N/A',
        'Cantidad Actual': s.current_quantity,
        'Fecha Recepción': new Date(s.received_date).toLocaleDateString(),
        'Fecha Caducidad': s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : 'N/A',
        'Precio Unitario': s.unit_price,
      };
    });

    const kitchenRequests = filteredTransactions.map((t) => ({
      'ID Solicitud': t.transaction_id,
      Solicitante: t.requester_name,
      'Aprobado Por': t.approver_name,
      'Almacén Origen': warehouseMap.get(t.source_warehouse_id) || 'N/A',
      Fecha: new Date(t.transaction_date).toLocaleDateString(),
      Estado: t.status,
      Notas: t.notes,
    }));

    const requestItems = filteredTransactions.flatMap((t) =>
      t.details.map((d) => ({
        'ID Solicitud': t.transaction_id,
        Producto: d.product_name,
        Cantidad: d.quantity,
      }))
    );

    return {
      donationSummary,
      donationItems,
      stockLotsData,
      kitchenRequests,
      requestItems,
    };
  },
  resetSystem: async (_token: string): Promise<{ success: boolean }> => {
    // This is a destructive action. In a real backend, this would archive data.
    // Here, we clear the relevant tables.
    await Promise.all([
      supabase.from('stock_lots').delete().neq('lot_id', 0), // Delete all
      supabase.from('donation_transactions').delete().neq('donation_id', 0),
      supabase.from('transactions').delete().neq('transaction_id', 0),
      supabase.from('transaction_details').delete().neq('detail_id', 0),
      supabase.from('daily_menus').delete().neq('menu_id', 0),
    ]);

    return { success: true };
  },
  importData: async (_token: string, data: unknown[]): Promise<{ summary: string }> => {
    // In a real backend, this is where complex logic to find-or-create entities would go.
    // Since we've pre-seeded the data for this demo, we just return a success message.
    const message = `Successfully processed ${data.length} records for import. Note: This is a simulation; for this demo, data has been pre-seeded into the database.`;
    return { summary: message };
  },
};
