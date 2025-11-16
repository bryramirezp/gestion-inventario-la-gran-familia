import { supabase } from './client';
import { donationApi } from './donation.api';
import { warehouseApi } from './warehouse.api';
import { productApi } from './product.api';
import { stockLotApi } from './warehouse.api';

export const systemApi = {
  getDataForExport: async (_token: string, year: number) => {
    const [donations, warehouses, products, stockLots] =
      await Promise.all([
        donationApi.getHistory(_token),
        warehouseApi.getAll(_token),
        productApi.getAll(_token),
        stockLotApi.getAll(_token),
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

    // Prepare data for sheets
    const donationSummary = filteredDonations.map((d) => ({
      'ID Donación': d.donation_id,
      Donante: d.donor_name,
      Almacén: d.warehouse_name,
      Fecha: new Date(d.donation_date).toLocaleDateString(),
      'Valor Total': d.actual_value,
    }));

    const donationItems = filteredDonations.flatMap((d) =>
      d.items.map((i) => ({
        'ID Donación': d.donation_id,
        Fecha: new Date(d.donation_date).toLocaleDateString(),
        Producto: i.product_name || 'Unknown Product',
        Cantidad: Number(i.current_quantity),
        'Precio de Mercado': i.market_unit_price,
        'Precio Real': i.actual_unit_price,
      }))
    );

    const stockLotsData = filteredStockLots.map((s) => {
      const product = productMap.get(s.product_id);
      return {
        'ID Lote': s.lot_id,
        Producto: product?.product_name || 'N/A',
        SKU: product?.sku || 'N/A',
        Almacén: warehouseMap.get(s.warehouse_id) || 'N/A',
        'Cantidad Actual': Number(s.current_quantity),
        'Fecha Recepción': new Date(s.received_date).toLocaleDateString(),
        'Fecha Caducidad': s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : 'N/A',
        'Precio Unitario': s.unit_price,
      };
    });

    return {
      donationSummary,
      donationItems,
      stockLotsData,
    };
  },
  resetSystem: async (_token: string): Promise<{ success: boolean }> => {
    // This is a destructive action. In a real backend, this would archive data.
    // Here, we clear the relevant tables.
    await Promise.all([
      supabase.from('stock_lots').delete().neq('lot_id', 0), // Delete all
      supabase.from('donation_transactions').delete().neq('donation_id', 0),
      // Kitchen module removed - transactions tables no longer used
      // supabase.from('transactions').delete().neq('transaction_id', 0),
      // supabase.from('transaction_details').delete().neq('detail_id', 0),
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

