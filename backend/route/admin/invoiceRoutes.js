import express from "express";
import { updateInvoiceDetails, updateInvoiceStatus, listPendingPayments } from "../../controller/admin/invoiceController.js";
import { authRequired, adminRequired } from "../../middleware/auth.js";

const router = express.Router();

router.get("/pending", authRequired, adminRequired, listPendingPayments);
router.patch("/:id/status", authRequired, adminRequired, updateInvoiceStatus);
router.patch("/:id", authRequired, adminRequired, updateInvoiceDetails);

export default router;
