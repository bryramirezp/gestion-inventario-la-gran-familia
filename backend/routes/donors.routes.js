import express from "express";
import {
  getDonadores,
  addDonador,
  getDonadorById,
  updateDonador,
  deleteDonador,
} from "../src/donors/donorController.js";

import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// GET: cualquier usuario autenticado
router.get("/", authenticateJWT, getDonadores);

// POST: solo admin
router.post("/", authenticateJWT, authorizeRoles("admin"), addDonador);

// GET por ID: cualquier usuario autenticado
router.get("/:id", authenticateJWT, getDonadorById);

// PUT: solo admin
router.put("/:id", authenticateJWT, authorizeRoles("admin"), updateDonador);

// DELETE: solo admin
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteDonador);

export default router;
