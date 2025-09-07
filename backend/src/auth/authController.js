import { supabase } from "../db/supabaseClient.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// Registro de usuario
export const registerUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validación de campos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    // Hashear password
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre, email, password_hash, rol }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: "Usuario creado", user: data[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: users, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email);

    if (error) throw error;
    if (!users.length)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    // Generar JWT
    const token = jwt.sign(
      { id: user.usuario_id, rol: user.rol },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: { id: user.usuario_id, nombre: user.nombre, rol: user.rol },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Middleware para proteger rutas
export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Token requerido" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Token inválido" });
      if (roles.length && !roles.includes(user.rol))
        return res.status(403).json({ message: "Acceso denegado" });

      req.user = user;
      next();
    });
  };
};
