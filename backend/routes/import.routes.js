import express from "express";
import { uploadDonativos } from "../src/import/importController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Ruta protegida: solo admin o inventario
router.post(
  "/donativos",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  upload.single("file"),
  uploadDonativos
);

export default router;
