import User from "../models/user/Users.js";

/**
 * Requires valid JWT (assumes authRequired already ran) and ADMIN role.
 */
export const adminRequired = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};