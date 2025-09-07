import express from "express";
import { archiveOldDonativos } from "../src/archive/archiveController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// Ruta protegida: solo admin o inventario
router.post(
  "/archivar",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  archiveOldDonativos
);

export default router;
