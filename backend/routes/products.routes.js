import express from "express";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  averagePrice,
} from "../src/products/productsController.js";

import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// GET: cualquier usuario autenticado puede ver productos
router.get("/", authenticateJWT, getProducts);

// POST: solo admins o inventario pueden agregar productos
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  addProduct
);

// PUT: solo admins o inventario pueden actualizar
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  updateProduct
);

// DELETE: solo admins pueden eliminar
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteProduct);

// GET promedio de precios: cualquier usuario autenticado
router.get("/average-price", authenticateJWT, averagePrice);

export default router;
