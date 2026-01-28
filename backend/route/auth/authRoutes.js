import express from "express";
import { login, register, me, forgotPassword, resetPassword } from "../../controller/auth/authController.js";
import { authRequired } from "../../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authRequired, me);

export default router;
