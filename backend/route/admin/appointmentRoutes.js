import express from "express";
import {
  listAppointments,
  updateAppointmentPrice,
  createAppointmentInvoice,
  getSlotOccupancy,
} from "../../controller/admin/appointmentController.js";
import { authRequired, adminRequired } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, adminRequired, listAppointments);
router.get("/slot-occupancy", authRequired, adminRequired, getSlotOccupancy);
router.patch("/:id/price", authRequired, adminRequired, updateAppointmentPrice);
router.post("/:id/invoice", authRequired, adminRequired, createAppointmentInvoice);

export default router;
