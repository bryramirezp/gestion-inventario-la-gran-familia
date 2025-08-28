import { supabase } from "../db/supabaseClient.js";

// Obtener todos los tipos de donadores
export const getTiposDonadores = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tiposdonadores")
      .select("*")
      .order("tipo_donador_id", { ascending: true });

    console.log("Supabase Error:", error);
    console.log("Supabase Data:", data);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (err) {
    console.error("Catch Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Agregar un nuevo tipo de donador
export const addTipoDonador = async (req, res) => {
  const { nombre } = req.body;
  const { data, error } = await supabase
    .from("tiposdonadores")
    .insert([{ nombre }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};
