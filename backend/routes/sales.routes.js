import express from "express";
import {
  getSales,
  addSale,
  updateSale,
  deleteSale,
} from "../src/sales/salesController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateJWT, getSales);
router.post("/", authenticateJWT, authorizeRoles("admin", "ventas"), addSale);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "ventas"),
  updateSale
);
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteSale);

export default router;
