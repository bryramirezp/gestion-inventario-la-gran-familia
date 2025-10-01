import { supabase } from "../db/supabaseClient.js";

// ✅ Obtener todos los donadores
export const getDonadores = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donadores") // 👈 en minúsculas
      .select("*")
      .order("donador_id", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error getDonadores:", err);
    res.status(500).json({ error: "Error al obtener donadores" });
  }
};

// ✅ Agregar un nuevo donador
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

  try {
    const { data, error } = await supabase
      .from("donadores") // 👈 en minúsculas
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
      .select()
      .single(); // devuelve solo el insertado

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Error addDonador:", err);
    res.status(500).json({ error: "Error al registrar donador" });
  }
};

// ✅ Obtener un donador por ID
export const getDonadorById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("donadores") // 👈 en minúsculas
      .select("*")
      .eq("donador_id", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error getDonadorById:", err);
    res.status(404).json({ error: "Donador no encontrado" });
  }
};

// ✅ Actualizar un donador
export const updateDonador = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from("donadores") // 👈 en minúsculas
      .update(updates)
      .eq("donador_id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error updateDonador:", err);
    res.status(500).json({ error: "Error al actualizar donador" });
  }
};

// ✅ Eliminar un donador
export const deleteDonador = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("donadores") // 👈 en minúsculas
      .delete()
      .eq("donador_id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Donador eliminado", data });
  } catch (err) {
    console.error("Error deleteDonador:", err);
    res.status(500).json({ error: "Error al eliminar donador" });
  }
};
