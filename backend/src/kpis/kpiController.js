import { supabase } from "../db/supabaseClient.js";

export const getWarehouseKpis = async (req, res) => {
  const { warehouseId } = req.params;

  try {
    // Total productos en el almacén
    const { data: productos } = await supabase
      .from("inventario")
      .select("cantidad")
      .eq("almacen_id", warehouseId);

    const totalProductos =
      productos?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

    // Productos en stock mínimo
    const { count: stockBajo } = await supabase
      .from("inventario")
      .select("*", { count: "exact", head: true })
      .lte("cantidad", 5)
      .eq("almacen_id", warehouseId);

    res.json({
      warehouseId,
      totalProductos,
      stockBajo,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
