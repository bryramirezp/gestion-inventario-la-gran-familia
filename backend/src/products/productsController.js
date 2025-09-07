import { supabase } from "../db/supabaseClient.js";

// Obtener todos los productos
export const getProducts = async (req, res) => {
  const { data, error } = await supabase.from("Productos").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
    .from("Productos")
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
    .from("Productos")
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
    .from("Productos")
    .delete()
    .eq("producto_id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Producto eliminado" });
};

// Promedio de precio de referencia
export const averagePrice = async (req, res) => {
  const { data, error } = await supabase
    .from("Productos")
    .select("precio_referencia");
  if (error) return res.status(500).json({ error: error.message });
  const avg =
    data.reduce((sum, p) => sum + Number(p.precio_referencia || 0), 0) /
    data.length;
  res.json({ averagePrice: avg });
};
