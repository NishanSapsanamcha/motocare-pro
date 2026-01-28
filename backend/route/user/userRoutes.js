import express from "express";
import { updateMe, updateMyAvatar } from "../../controller/user/userController.js";
import { createBike, listMyBikes, updateBike } from "../../controller/user/bikeController.js";
import { listApprovedGarages } from "../../controller/user/garageController.js";
import { cancelAppointment, createAppointment, listMyAppointments, getSlotAvailability } from "../../controller/user/appointmentController.js";
import { getMyRewards } from "../../controller/user/rewardController.js";
import { getInvoicePrintView, payInvoice } from "../../controller/user/invoiceController.js";
import { authRequired } from "../../middleware/auth.js";

const router = express.Router();

// test route
router.get("/", (req, res) => {
  res.json({ message: "User route working ?" });
});

router.put("/me", authRequired, updateMe);
router.put("/me/avatar", authRequired, updateMyAvatar);
router.post("/bikes", authRequired, createBike);
router.get("/bikes", authRequired, listMyBikes);
router.put("/bikes/:id", authRequired, updateBike);
router.get("/garages", authRequired, listApprovedGarages);
router.post("/appointments", authRequired, createAppointment);
router.get("/appointments", authRequired, listMyAppointments);
router.get("/appointments/availability", authRequired, getSlotAvailability);
router.patch("/appointments/:id/cancel", authRequired, cancelAppointment);
router.get("/rewards", authRequired, getMyRewards);
router.post("/invoices/:id/pay", authRequired, payInvoice);
router.get("/invoices/:id/print", authRequired, getInvoicePrintView);

export default router;
