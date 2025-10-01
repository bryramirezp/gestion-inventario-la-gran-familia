import { supabase } from "../db/supabaseClient.js";

export const getWarehouses = async (req, res) => {
  const { data, error } = await supabase.from("almacenes").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const getWarehouseById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("almacenes")
    .select("*")
    .eq("almacen_id", id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

export const createWarehouse = async (req, res) => {
  const {
    nombre,
    descripcion,
    tipo_almacen,
    capacidad_maxima,
    ubicacion_fisica,
  } = req.body;
  const { data, error } = await supabase
    .from("almacenes")
    .insert([
      { nombre, descripcion, tipo_almacen, capacidad_maxima, ubicacion_fisica },
    ]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const updateWarehouse = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    tipo_almacen,
    capacidad_maxima,
    ubicacion_fisica,
  } = req.body;
  const { data, error } = await supabase
    .from("almacenes")
    .update({
      nombre,
      descripcion,
      tipo_almacen,
      capacidad_maxima,
      ubicacion_fisica,
    })
    .eq("almacen_id", id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const deleteWarehouse = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("almacenes")
    .delete()
    .eq("almacen_id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
};
