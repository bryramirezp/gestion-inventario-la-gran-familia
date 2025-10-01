// src/routes/movement.routes.js
import express from "express";
import {
  getMovements,
  transferStock,
} from "../src/movements/movementController.js";

const router = express.Router();

router.get("/", getMovements); // GET /api/movements
router.post("/transfer", transferStock); // POST /api/movements/transfer

export default router;
