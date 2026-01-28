import express from "express";
import {
  getSales,
  getRevenueSummary,
  getDashboardStats,
} from "../../controller/admin/salesController.js";
import { authRequired } from "../../middleware/auth.js";
import { adminRequired } from "../../middleware/admin.js";

const router = express.Router();

router.use(authRequired, adminRequired);

router.get("/", getSales);
router.get("/summary", getRevenueSummary);
router.get("/summary/revenue", getRevenueSummary);
router.get("/dashboard/stats", getDashboardStats);

export default router;
