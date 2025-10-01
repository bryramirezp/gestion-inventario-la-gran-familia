import { supabase } from "../db/supabaseClient.js";

// Obtener todos los donativos
export const getDonations = async (req, res) => {
  try {
    const { page = 1, limit = 500 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("donativos")
      .select(
        `
        donativo_id,
        donador_id,
        usuario_id,
        total,
        total_con_descuento,
        fecha,
        items:detallesdonativos (
          producto_id,
          descripcion_producto,
          cantidad,
          precio_unitario,
          precio_total
        )
      `,
        { count: "exact" }
      )
      .order("fecha", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      donations: data,
      page: Number(page),
      limit: Number(limit),
      total: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener donativos" });
  }
};

// Obtener donativo por ID
export const getDonationById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("donativos")
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

  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    return res
      .status(400)
      .json({ error: "Debe incluir detalles del donativo" });
  }

  try {
    const { data: donativo, error: donError } = await supabase
      .from("donativos")
      .insert([{ donador_id, usuario_id, total, total_con_descuento }])
      .select()
      .single();

    if (donError) throw donError;

    const detalleInsert = detalles.map((item) => ({
      donativo_id: donativo.donativo_id,
      producto_id: item.producto_id,
      descripcion_producto: item.descripcion_producto,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_total: item.cantidad * item.precio_unitario,
      unidad_medida_id: item.unidad_medida_id,
      precio_factura: item.precio_factura || null,
    }));

    const { error: detalleError } = await supabase
      .from("detallesdonativos")
      .insert(detalleInsert);

    if (detalleError) throw detalleError;

    res.status(201).json({
      message: "Donativo registrado",
      donativo_id: donativo.donativo_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar donativo" });
  }
};

// Actualizar donativo
export const updateDonation = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from("donativos")
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
    .from("donativos")
    .delete()
    .eq("donativo_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Donativo eliminado", data });
};
