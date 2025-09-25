import jwt from "jsonwebtoken";
import { supabase } from "../db/supabaseClient.js";

// Middleware para verificar JWT
export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Verificar si usuario sigue activo
    const { data, error } = await supabase
      .from("usuarios")
      .select("activo, rol")
      .eq("usuario_id", decoded.usuario_id)
      .single();

    if (error || !data.activo)
      return res.status(403).json({ error: "Usuario inactivo" });
    req.user.rol = data.rol;

    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

// Middleware de roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol))
      return res.status(403).json({ error: "No autorizado" });
    next();
  };
};
