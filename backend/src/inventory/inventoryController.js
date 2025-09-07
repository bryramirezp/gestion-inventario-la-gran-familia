import { supabase } from "../db/supabaseClient.js";

// Obtener movimientos
export const getMovements = async (req, res) => {
  const { data, error } = await supabase
    .from("MovimientosInventario")
    .select("*")
    .order("movimiento_inventario_id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Agregar movimiento
export const addMovement = async (req, res) => {
  const { producto_id, tipo_movimiento, cantidad, usuario_id, observaciones } =
    req.body;

  if (cantidad <= 0)
    return res.status(400).json({ error: "Cantidad debe ser mayor a 0" });

  // Validar stock para salida
  if (tipo_movimiento === "salida") {
    const { data: producto, error: prodError } = await supabase
      .from("Productos")
      .select("stock")
      .eq("producto_id", producto_id)
      .single();
    if (prodError) return res.status(500).json({ error: prodError.message });
    if (producto.stock < cantidad)
      return res.status(400).json({ error: "Stock insuficiente" });
  }

  // Insertar movimiento
  const { data, error } = await supabase
    .from("MovimientosInventario")
    .insert([
      { producto_id, tipo_movimiento, cantidad, usuario_id, observaciones },
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  // Actualizar stock
  const stockUpdate = tipo_movimiento === "entrada" ? cantidad : -cantidad;
  await supabase
    .from("Productos")
    .update({ stock: supabase.raw("stock + ?", [stockUpdate]) })
    .eq("producto_id", producto_id);

  res.status(201).json({ message: "Movimiento registrado", data });
};

// Actualizar movimiento
export const updateMovement = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from("MovimientosInventario")
    .update(updates)
    .eq("movimiento_inventario_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Eliminar movimiento
export const deleteMovement = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("MovimientosInventario")
    .delete()
    .eq("movimiento_inventario_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Movimiento eliminado", data });
};
