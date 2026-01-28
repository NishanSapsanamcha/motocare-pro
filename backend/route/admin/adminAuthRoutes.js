import express from "express";
import {
  adminLogin,
  adminRegister,
  getAdminProfile,
} from "../../controller/admin/adminAuthController.js";
import { authRequired } from "../../middleware/auth.js";
import { adminRequired } from "../../middleware/admin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", authRequired, adminRequired, adminRegister);
router.get("/me", authRequired, adminRequired, getAdminProfile);

export default router;