import express from "express";
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  updateUserRole,
  deleteUser,
} from "../../controller/admin/userController.js";
import { authRequired } from "../../middleware/auth.js";
import { adminRequired } from "../../middleware/admin.js";

const router = express.Router();

router.use(authRequired, adminRequired);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export default router;