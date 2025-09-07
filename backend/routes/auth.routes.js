import express from "express";
import { registerUser, loginUser } from "../src/auth/authController.js";

const router = express.Router();

// Registro
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

export default router;
