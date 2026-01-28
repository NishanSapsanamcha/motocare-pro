import express from "express";
import { authRequired } from "../middleware/auth.js";
import { updateAppointmentStatus } from "../controller/admin/appointmentStatusController.js";

const router = express.Router();

router.patch("/:id/status", authRequired, updateAppointmentStatus);

export default router;
