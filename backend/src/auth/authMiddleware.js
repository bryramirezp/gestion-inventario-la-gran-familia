import jwt from "jsonwebtoken";
import { supabase } from "../db/supabaseClient.js";

// Middleware para verificar JWT
export const authenticateJWT = async (req, res, next) => {
  let token = null;

  // Primero revisa header Authorization
  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Luego revisa cookie
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return res.status(401).json({ error: "No token provided" });

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
