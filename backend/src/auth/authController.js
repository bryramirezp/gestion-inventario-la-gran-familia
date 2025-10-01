import { supabase } from "../db/supabaseClient.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// Registro de usuario
export const registerUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nombre, email, password_hash, rol, activo: true }])
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

    const token = jwt.sign(
      { usuario_id: user.usuario_id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false, // process.env.NODE_ENV === "production", // false en localhost
        sameSite: "strict",
        maxAge: 3 * 60 * 60 * 1000, // 3 horas
      })
      .json({
        user: { id: user.usuario_id, nombre: user.nombre, rol: user.rol },
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Middleware para proteger rutas
export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    let token = null;
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: "Token requerido" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Token inválido" });
      if (roles.length && !roles.includes(user.rol))
        return res.status(403).json({ message: "Acceso denegado" });

      req.user = user;
      next();
    });
  };
};

// Logout
export const logoutUser = (req, res) => {
  res.clearCookie("token").json({ message: "Sesión cerrada" });
};
