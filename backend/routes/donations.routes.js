import express from "express";
import {
  getDonations,
  addDonation,
  updateDonation,
  deleteDonation
} from "../src/donations/donationsController.js";
import { authenticateJWT, authorizeRoles } from "../src/auth/authMiddleware.js";

const router = express.Router();

// GET: cualquier usuario autenticado
router.get("/", authenticateJWT, getDonations);

// POST: admin, recepcion
router.post("/", authenticateJWT, authorizeRoles("admin", "recepcion"), addDonation);

// PUT: admin
router.put("/:id", authenticateJWT, authorizeRoles("admin"), updateDonation);

// DELETE: admin
router.delete("/:id", authenticateJWT, authorizeRoles("admin"), deleteDonation);

export default router;
