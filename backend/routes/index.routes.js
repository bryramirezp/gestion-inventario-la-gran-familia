import express from "express";
import tiposdonadoresRoutes from "./tiposdonadores.routes.js";
import donorsRoutes from "./donors.routes.js";
import productsRoutes from "./products.routes.js";
import donationsRoutes from "./donations.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import bazar from "./bazar.routes.js";
import cocina from "./cocina.routes.js";
import salesRoutes from "./sales.routes.js";
import reportsRoutes from "./reports.routes.js";
import importRoutes from "./import.routes.js";
import archiveRoutes from "./archive.routes.js";
import authRoutes from "./auth.routes.js";

const router = express.Router();

router.use("/tiposdonadores", tiposdonadoresRoutes);
router.use("/donors", donorsRoutes);
router.use("/products", productsRoutes);
router.use("/donations", donationsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/bazar", bazar);
router.use("/cocina", cocina);
router.use("/sales", salesRoutes);
router.use("/reports", reportsRoutes);
router.use("/import", importRoutes);
router.use("/archive", archiveRoutes);
router.use("/auth", authRoutes);

export default router;
