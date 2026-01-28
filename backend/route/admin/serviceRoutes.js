import express from "express";
import { authRequired } from "../../middleware/auth.js";
import { adminRequired } from "../../middleware/admin.js";
import {
  getAllServiceRequests,
  getServiceRequestById,
  assignServiceToGarage,
  updateServiceStatus,
  getServiceHistory,
  deleteServiceRequest,
} from "../../controller/admin/serviceController.js";

const router = express.Router();

router.use(authRequired, adminRequired);

router.get("/", getAllServiceRequests);
router.get("/:id", getServiceRequestById);
router.get("/:id/history", getServiceHistory);
router.patch("/:id/assign", assignServiceToGarage);
router.patch("/:id/status", updateServiceStatus);
router.delete("/:id", deleteServiceRequest);

export default router;