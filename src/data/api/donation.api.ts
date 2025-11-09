import {
  NewDonation,
  Donation,
  DonationItem,
  SupabaseDonationTransactionResponse,
} from '@/domain/types';
import { supabase } from './client';

export const donationApi = {
  createDonation: async (_token: string, donationData: NewDonation) => {
    try {
      // Preparar items en formato JSON para la función PostgreSQL
      const itemsJson = donationData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        market_unit_price: item.market_unit_price,
        actual_unit_price: item.actual_unit_price,
        expiry_date: item.expiry_date || null,
      }));

      // Llamar a la función PostgreSQL atómica
      const { data, error } = await supabase.rpc('create_donation_atomic', {
        p_donor_id: donationData.donor_id,
        p_warehouse_id: donationData.warehouse_id,
        p_items: itemsJson,
        p_donation_date: new Date().toISOString().split('T')[0], // Formato DATE (opcional, tiene default)
      });

      if (error) {
        // Manejar errores específicos de PostgreSQL
        if (error.message.includes('Donor not found')) {
          throw new Error(`Donante no encontrado: ${donationData.donor_id}`);
        }
        if (error.message.includes('Warehouse not found')) {
          throw new Error(`Almacén no encontrado: ${donationData.warehouse_id}`);
        }
        if (error.message.includes('Product not found')) {
          throw new Error(`Producto no encontrado en los items de la donación`);
        }
        if (error.message.includes('must have product_id')) {
          throw new Error('Cada item debe tener product_id, quantity, market_unit_price y actual_unit_price');
        }
        throw new Error(`Error al crear donación: ${error.message}`);
      }

      // Obtener la donación creada para retornarla
      const { data: donation, error: fetchError } = await supabase
        .from('donation_transactions')
        .select('*')
        .eq('donation_id', data.donation_id)
        .single();

      if (fetchError) {
        throw new Error(`Error al obtener donación creada: ${fetchError.message}`);
      }

      return { success: true, donation: donation };
    } catch (error: unknown) {
      // Re-lanzar el error con mensaje user-friendly
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la donación';
      throw new Error(errorMessage);
    }
  },
  /**
   * Obtiene el historial de donaciones con información relacionada usando JOINs optimizados.
   * Esta versión optimizada reduce significativamente la cantidad de datos transferidos
   * y mejora el rendimiento al usar JOINs de Supabase y filtrado en la base de datos.
   *
   * @param _token - Token de autenticación (no usado actualmente, mantenido para compatibilidad)
   * @param filters - Filtros opcionales para la consulta
   * @returns Array de donaciones enriquecidas con información de donante, almacén e items
   */
  getHistory: async (
    _token: string,
    filters?: {
      donor_id?: number;
      warehouse_id?: number;
      start_date?: string; // Formato: YYYY-MM-DD
      end_date?: string; // Formato: YYYY-MM-DD
      search?: string; // Buscar en donor_name y warehouse_name
      limit?: number;
      offset?: number;
      orderBy?: 'donation_date' | 'donation_id' | 'total_actual_value';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<Donation[]> => {
    try {
      // Construir query con JOINs optimizados
      // Cargamos donaciones con sus relaciones (donor, warehouse, items con products)
      let query = supabase
        .from('donation_transactions')
        .select(
          `
          *,
          donor:donors!donation_transactions_donor_id_fkey(
            donor_id,
            donor_name
          ),
          warehouse:warehouses!donation_transactions_warehouse_id_fkey(
            warehouse_id,
            warehouse_name
          ),
          donation_items(
            item_id,
            donation_id,
            product_id,
            quantity,
            market_unit_price,
            actual_unit_price,
            expiry_date,
            created_at,
            product:products!donation_items_product_id_fkey(
              product_id,
              product_name
            )
          )
        `,
          { count: 'exact' }
        );

      // Aplicar filtros opcionales
      if (filters?.donor_id) {
        query = query.eq('donor_id', filters.donor_id);
      }

      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      if (filters?.start_date) {
        query = query.gte('donation_date', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('donation_date', filters.end_date);
      }

      // Ordenar (por defecto: donation_date descendente para ver las más recientes primero)
      const orderBy = filters?.orderBy || 'donation_date';
      const orderDirection = filters?.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Paginación
      if (filters?.limit) {
        const offset = filters?.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data: donationsData, error: donationsError } = await query;

      if (donationsError) {
        throw new Error(`Error al obtener donaciones: ${donationsError.message}`);
      }

      if (!donationsData || donationsData.length === 0) {
        return [];
      }

      // Transformar los datos a la estructura esperada
      const enrichedHistory = donationsData.map((donation: SupabaseDonationTransactionResponse) => {
        // Extraer información de relaciones
        const donor = Array.isArray(donation.donor)
          ? donation.donor[0]
          : donation.donor;
        const warehouse = Array.isArray(donation.warehouse)
          ? donation.warehouse[0]
          : donation.warehouse;

        // Extraer items con nombres de productos
        const items = (donation.donation_items || []).map((item) => {
          const product = item.product
            ? (Array.isArray(item.product) ? item.product[0] : item.product)
            : null;
          return {
            item_id: item.item_id,
            donation_id: item.donation_id,
            product_id: item.product_id,
            quantity: item.quantity,
            market_unit_price: item.market_unit_price,
            actual_unit_price: item.actual_unit_price,
            expiry_date: item.expiry_date,
            created_at: item.created_at,
            // Campos adicionales para compatibilidad con DonationItem
            product_name: product?.product_name || 'Unknown Product',
            current_quantity: item.quantity, // Compatibilidad: mapear quantity a current_quantity
            warehouse_id: donation.warehouse_id, // Necesario para DonationItem
            received_date: donation.donation_date, // Usar donation_date como received_date
            unit_price: item.actual_unit_price, // Para compatibilidad con NewStockLot
          } as DonationItem;
        });

        // Usar los totales de la base de datos si están disponibles, sino calcularlos
        const total_market_value =
          donation.total_market_value ||
          items.reduce((acc, item) => acc + (item.market_unit_price || 0) * Number(item.quantity), 0);
        const total_actual_value =
          donation.total_actual_value ||
          items.reduce((acc, item) => acc + (item.actual_unit_price || 0) * Number(item.quantity), 0);

        return {
          donation_id: donation.donation_id,
          donor_id: donation.donor_id,
          warehouse_id: donation.warehouse_id,
          donation_date: donation.donation_date,
          created_at: donation.created_at,
          updated_at: donation.updated_at,
          donor_name: donor?.donor_name || 'Unknown Donor',
          warehouse_name: warehouse?.warehouse_name || 'Unknown Warehouse',
          items,
          total_market_value,
          total_actual_value,
        } as Donation;
      });

      // Aplicar filtro de búsqueda en memoria (si se especifica)
      // NOTA: Este filtro se aplica después porque busca en campos enriquecidos
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return enrichedHistory.filter(
          (donation) =>
            (donation.donor_name &&
              donation.donor_name.toLowerCase().includes(searchLower)) ||
            (donation.warehouse_name &&
              donation.warehouse_name.toLowerCase().includes(searchLower))
        );
      }

      return enrichedHistory;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener historial de donaciones';
      throw new Error(errorMessage);
    }
  },
};
