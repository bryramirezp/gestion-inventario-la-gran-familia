import express from "express";
import {
  getTiposDonadores,
  addTipoDonador,
} from "../src/donors/tipoDonadorController.js";

const router = express.Router();

router.get("/tipos-donadores/consulta", getTiposDonadores);
router.post("/tipos-donadores", addTipoDonador);

export default router;
