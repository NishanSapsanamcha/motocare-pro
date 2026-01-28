import Garage from "../../models/garage/Garage.js";
import User from "../../models/user/Users.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllGarages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_deleted: false };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Garage.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "full_name", "email", "phone_number"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Garages fetched",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get garages error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getGarageById = async (req, res) => {
  try {
    const { id } = req.params;
    const garage = await Garage.findOne({
      where: { id, is_deleted: false },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "full_name", "email", "phone_number"],
        },
      ],
    });

    if (!garage) return res.status(404).json({ message: "Garage not found" });
    return res.status(200).json({ message: "Garage fetched", data: garage });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const createGarage = async (req, res) => {
  try {
    const { name, address, phone, email, description, servicesOffered } = req.body;

    if (!name || !address || !phone || !email) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Name, address, phone, email required" });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const garage = await Garage.create({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      photo_url: photoUrl,
      description: description || null,
      services_offered: servicesOffered ? JSON.parse(servicesOffered) : [],
      status: "PENDING",
    });

    return res.status(201).json({
      message: "Garage created successfully",
      data: garage,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Create garage error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, description, servicesOffered } = req.body;

    const garage = await Garage.findOne({ where: { id, is_deleted: false } });
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    let photoUrl = garage.photo_url;
    if (req.file) {
      if (garage.photo_url) {
        const oldPath = path.join(__dirname, `../../${garage.photo_url}`);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photoUrl = `/uploads/${req.file.filename}`;
    }

    await garage.update({
      name: name || garage.name,
      address: address || garage.address,
      phone: phone || garage.phone,
      email: email || garage.email,
      photo_url: photoUrl,
      description: description !== undefined ? description : garage.description,
      services_offered: servicesOffered ? JSON.parse(servicesOffered) : garage.services_offered,
      updated_at: new Date(),
    });

    return res.status(200).json({
      message: "Garage updated successfully",
      data: garage,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Update garage error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const garage = await Garage.findOne({ where: { id, is_deleted: false } });
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    await garage.update({ is_deleted: true, updated_at: new Date() });
    return res.status(200).json({ message: "Garage deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const approveGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const garage = await Garage.findOne({ where: { id, is_deleted: false } });
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    await garage.update({ status: "APPROVED", updated_at: new Date() });
    return res.status(200).json({ message: "Garage approved", data: garage });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const rejectGarage = async (req, res) => {
  try {
    const { id } = req.params;
    const garage = await Garage.findOne({ where: { id, is_deleted: false } });
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    await garage.update({ status: "REJECTED", updated_at: new Date() });
    return res.status(200).json({ message: "Garage rejected", data: garage });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};