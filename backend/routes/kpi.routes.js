import express from "express";
import { getWarehouseKpis } from "../src/kpis/kpiController.js";

const router = express.Router();

router.get("/:warehouseId", getWarehouseKpis);

export default router;
