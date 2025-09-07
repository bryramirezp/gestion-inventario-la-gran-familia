import { supabase } from "../db/supabaseClient.js";

// Obtener todos los donativos
export const getDonations = async (req, res) => {
  const { data, error } = await supabase
    .from("Donativos")
    .select("*")
    .order("donativo_id", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Obtener donativo por ID
export const getDonationById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("Donativos")
    .select("*")
    .eq("donativo_id", id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// Agregar donativo con detalles
export const addDonation = async (req, res) => {
  const { donador_id, usuario_id, total, total_con_descuento, detalles } =
    req.body;

  if (!detalles || detalles.length === 0) {
    return res
      .status(400)
      .json({ error: "Debe incluir detalles del donativo" });
  }

  // Insertar donativo
  const { data: donativo, error } = await supabase
    .from("Donativos")
    .insert([{ donador_id, usuario_id, total, total_con_descuento }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Insertar detalles
  for (const item of detalles) {
    if (item.cantidad <= 0 || item.precio_unitario < 0)
      return res.status(400).json({ error: "Cantidad o precio inválido" });

    await supabase.from("DetallesDonativos").insert([
      {
        donativo_id: donativo.donativo_id,
        producto_id: item.producto_id,
        descripcion_producto: item.descripcion_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.cantidad * item.precio_unitario,
        unidad_medida_id: item.unidad_medida_id,
        precio_factura: item.precio_factura || null,
      },
    ]);
  }

  res
    .status(201)
    .json({
      message: "Donativo registrado",
      donativo_id: donativo.donativo_id,
    });
};

// Actualizar donativo
export const updateDonation = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from("Donativos")
    .update(updates)
    .eq("donativo_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Eliminar donativo
export const deleteDonation = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("Donativos")
    .delete()
    .eq("donativo_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Donativo eliminado", data });
};
