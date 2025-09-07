import { supabase } from "../db/supabaseClient.js";

export const archiveOldDonativos = async (req, res) => {
  const { fecha_limite } = req.body; // Ej: '2024-01-01'

  try {
    const { error } = await supabase.rpc("mover_donativos_antiguos", {
      fecha_limite,
    });

    if (error) throw error;

    res.json({ message: "Datos antiguos archivados correctamente" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error archivando datos", error: err.message });
  }
};
