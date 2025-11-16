import {
  Product,
  NewProduct,
  Category,
  NewCategory,
  Brand,
  NewBrand,
  Unit,
  StockLot,
  SupabaseProductResponse,
  EnrichedProduct,
} from '@/domain/types';
import { supabase } from './client';

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

export const getUnits = async (_token: string): Promise<Unit[]> => {
  const { data, error } = await supabase.from('units').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

// Tipo para filtros opcionales de getFullProductDetails
export interface GetFullProductDetailsFilters {
  category_id?: number;
  brand_id?: number;
  warehouse_id?: number;
  search?: string; // Buscar en product_name y sku
  lowStockOnly?: boolean; // Solo productos con stock bajo
  limit?: number;
  offset?: number;
  orderBy?: 'product_name' | 'product_id' | 'total_stock';
  orderDirection?: 'asc' | 'desc';
}

// Re-export EnrichedProduct para compatibilidad con imports existentes
export type { EnrichedProduct } from '@/domain/types';

/**
 * Obtiene productos con información relacionada usando JOINs optimizados.
 * Esta versión optimizada reduce significativamente la cantidad de datos transferidos
 * y mejora el rendimiento al usar JOINs de Supabase y filtrado en la base de datos.
 *
 * @param _token - Token de autenticación (no usado actualmente, mantenido para compatibilidad)
 * @param filters - Filtros opcionales para la consulta
 * @returns Array de productos enriquecidos con información de categoría, marca, unidad y stock
 */
export const getFullProductDetails = async (
  _token: string,
  filters?: number | GetFullProductDetailsFilters
): Promise<EnrichedProduct[]> => {
  try {
    // Compatibilidad: Si filters es un number, es el warehouseId (comportamiento antiguo)
    let filtersObj: GetFullProductDetailsFilters | undefined;
    if (typeof filters === 'number') {
      filtersObj = { warehouse_id: filters };
    } else {
      filtersObj = filters;
    }

    // Construir query con JOINs optimizados
    // Cargamos productos con sus relaciones (categoría, marca, unidad)
    let query = supabase
      .from('products')
      .select(
        `
        *,
        category:categories!products_category_id_fkey(
          category_id,
          category_name
        ),
        brand:brands!products_brand_id_fkey(
          brand_id,
          brand_name
        ),
        unit:units!products_official_unit_id_fkey(
          unit_id,
          abbreviation
        )
      `,
        { count: 'exact' }
      );

    // Aplicar filtros opcionales
    if (filtersObj?.category_id) {
      query = query.eq('category_id', filtersObj.category_id);
    }

    if (filtersObj?.brand_id) {
      query = query.eq('brand_id', filtersObj.brand_id);
    }

    if (filtersObj?.search) {
      // Búsqueda en product_name y sku (case-insensitive)
      // Usamos ilike con patrones para búsqueda parcial
      const searchPattern = `%${filtersObj.search}%`;
      query = query.or(`product_name.ilike.${searchPattern},sku.ilike.${searchPattern}`);
    }

    // Ordenar (por defecto: product_name ascendente)
    const orderBy = filtersObj?.orderBy || 'product_name';
    const orderDirection = filtersObj?.orderDirection || 'asc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Paginación
    if (filtersObj?.limit) {
      const offset = filtersObj?.offset || 0;
      query = query.range(offset, offset + filtersObj.limit - 1);
    }

    const { data: productsData, error: productsError } = await query;

    if (productsError) {
      throw new Error(`Error al obtener productos: ${productsError.message}`);
    }

    if (!productsData || productsData.length === 0) {
      return [];
    }

    // Extraer product_ids para cargar solo los stock_lots necesarios
    const productIds = productsData.map((p: SupabaseProductResponse) => p.product_id);

    // Cargar todos los lotes de los productos (una sola query)
    // Filtramos por warehouse_id si se especifica, pero no por is_expired (necesitamos todos para el campo 'lots')
    let stockLotsQuery = supabase.from('stock_lots').select('*').in('product_id', productIds);

    if (filtersObj?.warehouse_id) {
      stockLotsQuery = stockLotsQuery.eq('warehouse_id', filtersObj.warehouse_id);
    }

    const { data: allStockLotsData, error: stockLotsError } = await stockLotsQuery;

    if (stockLotsError) {
      console.warn('Error al cargar stock_lots:', stockLotsError.message);
    }

    const stockLots = allStockLotsData || [];

    // Agrupar lotes por product_id (todos los lotes para el campo 'lots')
    const lotsByProduct = new Map<number, StockLot[]>();
    stockLots.forEach((lot) => {
      if (!lotsByProduct.has(lot.product_id)) {
        lotsByProduct.set(lot.product_id, []);
      }
      lotsByProduct.get(lot.product_id)!.push(lot);
    });

    // Filtrar lotes usables (no vencidos, cantidad > 0) para cálculos de total_stock
    // NOTA: Mantenemos compatibilidad con EXPIRED_WAREHOUSE_ID aunque ya no se use
    const usableLotsByProduct = new Map<number, StockLot[]>();
    stockLots.forEach((lot) => {
      // Filtrar lotes vencidos y con cantidad > 0
      if (!lot.is_expired && Number(lot.current_quantity) > 0) {
        if (!usableLotsByProduct.has(lot.product_id)) {
          usableLotsByProduct.set(lot.product_id, []);
        }
        usableLotsByProduct.get(lot.product_id)!.push(lot);
      }
    });

    // Transformar los datos a la estructura esperada
    const enrichedProducts = productsData.map((product: SupabaseProductResponse) => {
      // Extraer información de relaciones
      const category = Array.isArray(product.category)
        ? product.category[0]
        : product.category;
      const brand = Array.isArray(product.brand) ? product.brand[0] : product.brand;
      const unit = Array.isArray(product.unit) ? product.unit[0] : product.unit;

      // Obtener lotes del producto
      const productLots = lotsByProduct.get(product.product_id) || [];
      const usableLots = usableLotsByProduct.get(product.product_id) || [];

      // Calcular total_stock (solo de lotes usables)
      const totalStock = usableLots.reduce(
        (sum, lot) => sum + Number(lot.current_quantity),
        0
      );

      // Calcular fecha de expiración más cercana
      const soonestExpiry = usableLots
        .filter((l) => l.expiry_date)
        .map((l) => new Date(l.expiry_date!))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      let daysToExpiry: number | null = null;
      if (soonestExpiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        daysToExpiry = Math.ceil(
          (soonestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...product,
        category_name: category?.category_name || 'N/A',
        brand_name: brand?.brand_name || (product.brand_id ? 'N/A' : 'N/A'),
        unit_abbreviation: unit?.abbreviation || 'N/A',
        total_stock: totalStock,
        lots: productLots,
        soonest_expiry_date: soonestExpiry ? soonestExpiry.toISOString().split('T')[0] : null,
        days_to_expiry: daysToExpiry,
      } as EnrichedProduct;
    });

    // Filtrar por lowStockOnly si se especifica (después de calcular total_stock)
    if (filtersObj?.lowStockOnly) {
      return enrichedProducts.filter(
        (p) => p.total_stock < (p.low_stock_threshold || 0)
      );
    }

    return enrichedProducts;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener productos';
    throw new Error(errorMessage);
  }
};

export const getLotsForConsumption = async (
  token: string,
  productId: number,
  warehouseId: number,
  quantity?: number
): Promise<StockLot[]> => {
  const { data, error } = await supabase.rpc('get_lots_for_consumption', {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_quantity: quantity || null,
  });
  if (error) throw new Error(error.message);
  return data || [];
};