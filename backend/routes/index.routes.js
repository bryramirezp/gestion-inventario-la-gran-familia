import express from "express";
import {
  getDonadores,
  addDonador,
  getDonadorById,
  updateDonador,
  deleteDonador,
} from "../src/donors/donorController.js";

const router = express.Router();

router.get("/donors", getDonadores);
router.post("/donors", addDonador);
router.get("/donors/:id", getDonadorById);
router.put("/donors/:id", updateDonador);
router.delete("/donors/:id", deleteDonador);

export default router;
