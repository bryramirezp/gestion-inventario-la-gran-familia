import { supabase } from "../db/supabaseClient.js";

// Promedio de precios por producto
export const averagePriceByProduct = async (req, res) => {
  const { data, error } = await supabase
    .from("HistoricoPrecios")
    .select("producto_id, precio");
  if (error) return res.status(500).json({ error: error.message });

  const avgByProduct = {};
  data.forEach((row) => {
    if (!avgByProduct[row.producto_id]) avgByProduct[row.producto_id] = [];
    avgByProduct[row.producto_id].push(Number(row.precio));
  });

  const result = Object.entries(avgByProduct).map(([producto_id, precios]) => ({
    producto_id,
    promedio: precios.reduce((a, b) => a + b, 0) / precios.length,
  }));

  res.json(result);
};

// Consumos de cocina agregados
export const kpiConsumption = async (req, res) => {
  const { data, error } = await supabase
    .from("ConsumosCocina")
    .select("producto_id, cantidad");
  if (error) return res.status(500).json({ error: error.message });

  const totalByProduct = {};
  data.forEach((row) => {
    totalByProduct[row.producto_id] =
      (totalByProduct[row.producto_id] || 0) + Number(row.cantidad);
  });

  res.json(totalByProduct);
};

// Rendimiento de usuarios
export const userPerformance = async (req, res) => {
  const { data, error } = await supabase
    .from("RendimientoUsuarios")
    .select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Reporte de movimientos de inventario
export const inventoryMovementsReport = async (req, res) => {
  const { data, error } = await supabase
    .from("MovimientosInventario")
    .select("*")
    .order("fecha", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
