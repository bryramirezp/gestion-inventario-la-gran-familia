import { supabase } from "../db/supabaseClient.js";

// Obtener todos los donadores
export const getDonadores = async (req, res) => {
  const { data, error } = await supabase
    .from("Donadores")
    .select("*")
    .order("donador_id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Agregar un nuevo donador
export const addDonador = async (req, res) => {
  const {
    nombre_completo,
    telefono,
    correo,
    fecha_nacimiento,
    direccion,
    tipo_donador_id,
    activo = true,
  } = req.body;

  const { data, error } = await supabase
    .from("Donadores")
    .insert([
      {
        nombre_completo,
        telefono,
        correo,
        fecha_nacimiento,
        direccion,
        tipo_donador_id,
        activo,
      },
    ])
    .select(); // devuelve el registro insertado

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// Obtener un donador por ID
export const getDonadorById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("Donadores")
    .select("*")
    .eq("donador_id", id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

// Actualizar un donador
export const updateDonador = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from("Donadores")
    .update(updates)
    .eq("donador_id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Eliminar un donador
export const deleteDonador = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("Donadores")
    .delete()
    .eq("donador_id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Donador eliminado", data });
};
