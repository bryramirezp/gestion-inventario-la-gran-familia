import { supabase } from "../db/supabaseClient.js";

// Obtener todas las ventas
export const getBazarSales = async (req, res) => {
  const { data, error } = await supabase
    .from("VentasBazar")
    .select("*")
    .order("venta_id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Agregar venta con detalle
export const addBazarSale = async (req, res) => {
  const { usuario_id, total, detalles } = req.body;

  if (!detalles || detalles.length === 0)
    return res.status(400).json({ error: "Debe incluir detalles de venta" });

  // Insertar venta
  const { data: venta, error } = await supabase
    .from("VentasBazar")
    .insert([{ usuario_id, total }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Insertar detalles y actualizar stock
  for (const item of detalles) {
    if (item.cantidad <= 0 || item.precio_unitario < 0)
      return res.status(400).json({ error: "Cantidad o precio inválido" });

    await supabase.from("DetallesVentasBazar").insert([
      {
        venta_id: venta.venta_id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.cantidad * item.precio_unitario,
      },
    ]);

    // Reducir stock del producto
    await supabase
      .from("Productos")
      .update({ stock: supabase.raw("stock - ?", [item.cantidad]) })
      .eq("producto_id", item.producto_id);
  }

  res
    .status(201)
    .json({ message: "Venta registrada", venta_id: venta.venta_id });
};

// Obtener venta por ID
export const getBazarSaleById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("VentasBazar")
    .select("*")
    .eq("venta_id", id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

export const updateBazarSale = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from("VentasBazar")
    .update(updates)
    .eq("venta_id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Venta actualizada", data });
};

// Eliminar venta
export const deleteBazarSale = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("VentasBazar")
    .delete()
    .eq("venta_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Venta eliminada", data });
};
