import express from "express";
import {
  getBazarSales,
  addBazarSale,
  updateBazarSale,
  deleteBazarSale,
} from "../src/bazar/bazarController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateJWT, getBazarSales);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "ventas"),
  addBazarSale
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "ventas"),
  updateBazarSale
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  deleteBazarSale
);

export default router;
