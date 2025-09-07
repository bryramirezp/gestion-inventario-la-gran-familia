import express from "express";
import {
  getKitchenConsumptions,
  addKitchenConsumption,
  updateKitchenConsumption,
  deleteKitchenConsumption,
} from "../src/cocina/cocinaController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

router.get("/", authenticateJWT, getKitchenConsumptions);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "cocina"),
  addKitchenConsumption
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin", "cocina"),
  updateKitchenConsumption
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  deleteKitchenConsumption
);

export default router;
