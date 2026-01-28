import ServiceRequest from "../../models/service/ServiceRequest.js";
import ServiceStatusHistory from "../../models/service/ServiceStatusHistory.js";
import User from "../../models/user/Users.js";
import Garage from "../../models/garage/Garage.js";
import { Op } from "sequelize";

export const getAllServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", search = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_deleted: false };
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { service_type: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ServiceRequest.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: "user", attributes: ["id", "full_name", "email", "phone_number"] },
        { model: Garage, as: "garage", attributes: ["id", "name", "email", "phone"] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Service requests fetched",
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await ServiceRequest.findOne({
      where: { id, is_deleted: false },
      include: [
        { model: User, as: "user", attributes: ["id", "full_name", "email", "phone_number"] },
        { model: Garage, as: "garage", attributes: ["id", "name", "email", "phone"] },
        {
          model: ServiceStatusHistory,
          as: "statusHistory",
          include: [{ model: User, as: "updatedByUser", attributes: ["id", "full_name"] }],
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!service) return res.status(404).json({ message: "Service request not found" });
    return res.status(200).json({ message: "Service request fetched", data: service });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const assignServiceToGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const { garageId } = req.body;

    if (!garageId) return res.status(400).json({ message: "Garage ID required" });

    const service = await ServiceRequest.findOne({ where: { id, is_deleted: false } });
    if (!service) return res.status(404).json({ message: "Service request not found" });

    const garage = await Garage.findOne({ where: { id: garageId, status: "APPROVED", is_deleted: false } });
    if (!garage) return res.status(404).json({ message: "Garage not found or not approved" });

    await service.update({ garage_id: garageId, updated_at: new Date() });

    await ServiceStatusHistory.create({
      service_request_id: id,
      status: service.status,
      note: `Service assigned to garage: ${garage.name}`,
      updated_by: req.userId,
    });

    return res.status(200).json({ message: "Service assigned successfully", data: service });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) return res.status(400).json({ message: "Status required" });

    const validStatuses = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const service = await ServiceRequest.findOne({ where: { id, is_deleted: false } });
    if (!service) return res.status(404).json({ message: "Service request not found" });

    const oldStatus = service.status;
    const updateData = { status, updated_at: new Date() };
    if (status === "COMPLETED") updateData.completed_date = new Date();

    await service.update(updateData);

    await ServiceStatusHistory.create({
      service_request_id: id,
      status,
      note: note || `Status changed from ${oldStatus} to ${status}`,
      updated_by: req.userId,
    });

    return res.status(200).json({ message: "Service status updated", data: service });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getServiceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await ServiceStatusHistory.findAll({
      where: { service_request_id: id },
      include: [{ model: User, as: "updatedByUser", attributes: ["id", "full_name", "email"] }],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ message: "Service history fetched", data: history });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await ServiceRequest.findOne({ where: { id, is_deleted: false } });
    if (!service) return res.status(404).json({ message: "Service request not found" });

    await service.update({ is_deleted: true, updated_at: new Date() });
    return res.status(200).json({ message: "Service request deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};