import { supabase } from "../db/supabaseClient.js";

export const getPermissions = async (req, res) => {
  const { warehouseId } = req.params;
  const { data, error } = await supabase
    .from("usuarios_almacenes_permisos")
    .select("id, usuario_id, rol_almacen, activo")
    .eq("almacen_id", warehouseId);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const assignPermission = async (req, res) => {
  const { usuario_id, almacen_id, rol_almacen } = req.body;
  const { data, error } = await supabase
    .from("usuarios_almacenes_permisos")
    .insert([{ usuario_id, almacen_id, rol_almacen }]);

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const revokePermission = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("usuarios_almacenes_permisos")
    .delete()
    .eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
};
