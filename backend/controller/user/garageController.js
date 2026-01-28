import { Op } from "sequelize";
import Garage from "../../models/garage/Garage.js";

export const listApprovedGarages = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const whereClause = { status: "APPROVED", is_deleted: false };
    if (search) {
      const like = `%${String(search).trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.iLike]: like } },
        { address: { [Op.iLike]: like } },
      ];
    }
    const garages = await Garage.findAll({
      where: whereClause,
      attributes: ["id", "name", "address", "phone", "email", "photo_url"],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Garages fetched",
      data: garages,
    });
  } catch (error) {
    console.error("List garages error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
