import express from "express";
import { authRequired } from "../../middleware/auth.js";
import { adminRequired } from "../../middleware/admin.js";
import upload from "../../config/multer.js";
import {
  getAllGarages,
  createGarage,
  updateGarage,
  deleteGarage,
  approveGarage,
  rejectGarage,
  getGarageById,
} from "../../controller/admin/garageController.js";

const router = express.Router();

router.use(authRequired, adminRequired);

router.get("/", getAllGarages);
router.post("/", upload.single("photo"), createGarage);
router.get("/:id", getGarageById);
router.put("/:id", upload.single("photo"), updateGarage);
router.delete("/:id", deleteGarage);
router.patch("/:id/approve", approveGarage);
router.patch("/:id/reject", rejectGarage);

export default router;