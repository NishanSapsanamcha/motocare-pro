import User from "../../models/user/Users.js";
import ServiceRequest from "../../models/service/ServiceRequest.js";
import { Op } from "sequelize";

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_deleted: false, role: { [Op.ne]: "ADMIN" } };
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone_number: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) whereClause.role = role;

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Users fetched",
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id, is_deleted: false },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: ServiceRequest,
          as: "serviceRequests",
          where: { is_deleted: false },
          required: false,
          attributes: ["id", "service_type", "status", "requested_date", "completed_date"],
        },
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User fetched", data: user });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, is_deleted: false } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ is_blocked: true, updated_at: new Date() });
    return res.status(200).json({
      message: "User blocked",
      data: { id: user.id, fullName: user.full_name, email: user.email, isBlocked: user.is_blocked },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, is_deleted: false } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ is_blocked: false, updated_at: new Date() });
    return res.status(200).json({
      message: "User unblocked",
      data: { id: user.id, fullName: user.full_name, email: user.email, isBlocked: user.is_blocked },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) return res.status(400).json({ message: "Role required" });
    if (!["USER"].includes(role)) return res.status(400).json({ message: "Invalid role" });

    const user = await User.findOne({ where: { id, is_deleted: false } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") return res.status(403).json({ message: "Cannot change admin role" });

    await user.update({ role, updated_at: new Date() });
    return res.status(200).json({
      message: "User role updated",
      data: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, is_deleted: false } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") return res.status(403).json({ message: "Cannot delete admin user" });

    await user.update({ is_deleted: true, updated_at: new Date() });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
