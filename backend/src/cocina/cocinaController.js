import { supabase } from "../db/supabaseClient.js";

// Obtener todos los consumos
export const getKitchenConsumptions = async (req, res) => {
  const { data, error } = await supabase
    .from("ConsumosCocina")
    .select("*")
    .order("consumo_cocina_id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Agregar consumo de cocina
export const addKitchenConsumption = async (req, res) => {
  const {
    producto_id,
    cantidad,
    responsable_id,
    firmado_por_id,
    costo_estimado,
  } = req.body;

  if (cantidad <= 0)
    return res.status(400).json({ error: "Cantidad debe ser mayor a 0" });

  // Validar stock y caducidad
  const { data: producto, error: prodError } = await supabase
    .from("Productos")
    .select("stock, fecha_caducidad")
    .eq("producto_id", producto_id)
    .single();
  if (prodError) return res.status(500).json({ error: prodError.message });
  if (producto.stock < cantidad)
    return res.status(400).json({ error: "Stock insuficiente" });
  if (
    producto.fecha_caducidad &&
    new Date(producto.fecha_caducidad) < new Date()
  )
    return res.status(400).json({ error: "Producto caducado" });

  // Registrar consumo
  const { data, error } = await supabase
    .from("ConsumosCocina")
    .insert([
      { producto_id, cantidad, responsable_id, firmado_por_id, costo_estimado },
    ])
    .select();
  if (error) return res.status(500).json({ error: error.message });

  // Actualizar stock
  await supabase
    .from("Productos")
    .update({ stock: producto.stock - cantidad })
    .eq("producto_id", producto_id);

  res.status(201).json({ message: "Consumo registrado", data });
};
// Eliminar consumo de cocina
export const deleteKitchenConsumption = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("ConsumosCocina")
    .delete()
    .eq("consumo_cocina_id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Consumo eliminado", data });
};

// Actualizar consumo de cocina
export const updateKitchenConsumption = async (req, res) => {
  const { id } = req.params;
  const {
    producto_id,
    cantidad,
    responsable_id,
    firmado_por_id,
    costo_estimado,
  } = req.body;

  // Validar cantidad
  if (cantidad <= 0)
    return res.status(400).json({ error: "Cantidad debe ser mayor a 0" });

  // Validar stock y producto
  const { data: producto, error: prodError } = await supabase
    .from("Productos")
    .select("stock")
    .eq("producto_id", producto_id)
    .single();
  if (prodError) return res.status(500).json({ error: prodError.message });

  // Obtener consumo actual
  const { data: consumoActual, error: consumoError } = await supabase
    .from("ConsumosCocina")
    .select("*")
    .eq("consumo_cocina_id", id)
    .single();
  if (consumoError)
    return res.status(500).json({ error: consumoError.message });

  // Ajustar stock: revertir consumo anterior
  const stockAjuste = consumoActual.cantidad - cantidad; // positivo aumenta stock, negativo disminuye
  if (producto.stock + stockAjuste < 0)
    return res
      .status(400)
      .json({ error: "Stock insuficiente para actualización" });

  await supabase
    .from("Productos")
    .update({ stock: producto.stock + stockAjuste })
    .eq("producto_id", producto_id);

  // Actualizar registro de consumo
  const { data, error } = await supabase
    .from("ConsumosCocina")
    .update({
      producto_id,
      cantidad,
      responsable_id,
      firmado_por_id,
      costo_estimado,
    })
    .eq("consumo_cocina_id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Consumo actualizado", data });
};
