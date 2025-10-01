import express from "express";
import {
  getPermissions,
  assignPermission,
  revokePermission,
} from "../src/permissions/permissionController.js";

const router = express.Router();

router.get("/:warehouseId", getPermissions);
router.post("/", assignPermission);
router.delete("/:id", revokePermission);

export default router;
