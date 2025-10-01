import { supabase } from "../db/supabaseClient.js";

// Obtener todos los productos
export const getProducts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("productos")
    .select("*", { count: "exact" })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data, total: count });
};

// Agregar un producto
export const addProduct = async (req, res) => {
  const {
    nombre,
    descripcion,
    categoria_producto_id,
    unidad_medida_id,
    stock,
    precio_referencia,
  } = req.body;
  const { data, error } = await supabase
    .from("productos")
    .insert([
      {
        nombre,
        descripcion,
        categoria_producto_id,
        unidad_medida_id,
        stock,
        precio_referencia,
      },
    ])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { data, error } = await supabase
    .from("productos")
    .update(updates)
    .eq("producto_id", id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

// Eliminar producto
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("producto_id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Producto eliminado" });
};

// Promedio de precio de referencia
export const averagePrice = async (req, res) => {
  const { data, error } = await supabase
    .from("productos")
    .select("precio_referencia");
  if (error) return res.status(500).json({ error: error.message });
  const avg =
    data.reduce((sum, p) => sum + Number(p.precio_referencia || 0), 0) /
    data.length;
  res.json({ averagePrice: avg });
};
