import express from "express";
import {
  getMovements,
  addMovement,
  updateMovement,
  deleteMovement,
} from "../src/inventory/inventoryController.js";

import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// GET: cualquier usuario autenticado
router.get("/", authenticateJWT, getMovements);

// POST: solo admin o inventario
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  addMovement
);

// PUT: solo admin o inventario
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  updateMovement
);

// DELETE: solo admin
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteMovement);

export default router;
