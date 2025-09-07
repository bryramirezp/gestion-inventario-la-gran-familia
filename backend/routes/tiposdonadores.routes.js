import express from "express";
import {
  getTiposDonadores,
  addTipoDonador,
} from "../src/donors/tipoDonadorController.js";
import { authMiddleware } from "../src/auth/authController.js";

const router = express.Router();

router.get("/", authMiddleware(), getTiposDonadores);
router.post("/", authMiddleware(["superadmin", "admin"]), addTipoDonador);

export default router;
