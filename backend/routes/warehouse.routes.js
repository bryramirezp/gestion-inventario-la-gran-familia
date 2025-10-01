import express from "express";
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../src/warehouses/warehouseController.js";

const router = express.Router();

// CRUD almacenes
router.get("/", getWarehouses);
router.get("/:id", getWarehouseById);
router.post("/", createWarehouse);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

export default router;
