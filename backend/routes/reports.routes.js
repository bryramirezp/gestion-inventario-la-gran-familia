import express from "express";
import {
  averagePriceByProduct,
  kpiConsumption,
  inventoryMovementsReport,
  userPerformance,
} from "../src/reports/reportsController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// Todos los reportes requieren al menos usuario autenticado
router.get("/average-price", authenticateJWT, averagePriceByProduct);
router.get(
  "/kpi-consumption",
  authenticateJWT,
  authorizeRoles("admin", "cocina"),
  kpiConsumption
);
router.get(
  "/inventory-movements",
  authenticateJWT,
  authorizeRoles("admin", "inventario"),
  inventoryMovementsReport
);
router.get(
  "/user-performance",
  authenticateJWT,
  authorizeRoles("admin"),
  userPerformance
);

export default router;
