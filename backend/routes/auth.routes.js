import express from "express";
import {
  registerUser,
  loginUser,
  authMiddleware,
  logoutUser,
} from "../src/auth/authController.js";

const router = express.Router();

// Registro
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", logoutUser);

// Obtener info del usuario autenticado
router.get("/me", authMiddleware(), (req, res) => {
  if (!req.user) return res.status(401).json({ message: "No autorizado" });
  res.json({ user: req.user });
});

export default router;
