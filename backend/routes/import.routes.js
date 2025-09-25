import express from "express";
import { uploadDonativos } from "../src/import/importController.js";
import { upload } from "../src/utils/uploadMiddleware.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// Ruta protegida: solo admin o inventario
router.post(
  "/donativos",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  upload.single("file"),
  uploadDonativos
);

export default router;
