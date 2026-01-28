import Bike from "../../models/bike/Bike.js";

export const createBike = async (req, res) => {
  try {
    const userId = req.userId;
    const existing = await Bike.findOne({ where: { user_id: userId } });
    if (existing) {
      return res.status(409).json({ message: "You can only save one bike" });
    }
    const {
      company,
      model,
      registration,
      color,
      useNewNumber,
      state,
      newRegistration,
    } = req.body;

    if (!company || !model || !color) {
      return res.status(400).json({ message: "Company, model, and color are required" });
    }

    if (useNewNumber) {
      if (!state || !newRegistration) {
        return res.status(400).json({ message: "State and new registration are required for new number system" });
      }
    } else if (!registration) {
      return res.status(400).json({ message: "Registration is required" });
    }

    const resolvedRegistration = registration || newRegistration;
    if (!resolvedRegistration) {
      return res.status(400).json({ message: "Registration is required" });
    }

    const bike = await Bike.create({
      user_id: userId,
      company: String(company).trim(),
      model: String(model).trim(),
      registration_no: String(resolvedRegistration).trim(),
      color: String(color).trim(),
      use_new_number: Boolean(useNewNumber),
      state: useNewNumber ? String(state).trim() : null,
      new_registration_no: useNewNumber ? String(newRegistration).trim() : null,
    });

    return res.status(201).json({
      message: "Bike saved",
      data: bike,
    });
  } catch (error) {
    console.error("Create bike error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const listMyBikes = async (req, res) => {
  try {
    const userId = req.userId;
    const bikes = await Bike.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Bikes fetched",
      data: bikes,
    });
  } catch (error) {
    console.error("List bikes error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateBike = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {
      company,
      model,
      registration,
      color,
      useNewNumber,
      state,
      newRegistration,
    } = req.body;

    if (!company || !model || !color) {
      return res.status(400).json({ message: "Company, model, and color are required" });
    }

    if (useNewNumber) {
      if (!state || !newRegistration) {
        return res.status(400).json({ message: "State and new registration are required for new number system" });
      }
    } else if (!registration) {
      return res.status(400).json({ message: "Registration is required" });
    }

    const resolvedRegistration = registration || newRegistration;
    if (!resolvedRegistration) {
      return res.status(400).json({ message: "Registration is required" });
    }

    const bike = await Bike.findOne({ where: { id, user_id: userId } });
    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    await bike.update({
      company: String(company).trim(),
      model: String(model).trim(),
      registration_no: String(resolvedRegistration).trim(),
      color: String(color).trim(),
      use_new_number: Boolean(useNewNumber),
      state: useNewNumber ? String(state).trim() : null,
      new_registration_no: useNewNumber ? String(newRegistration).trim() : null,
      updated_at: new Date(),
    });

    return res.status(200).json({
      message: "Bike updated",
      data: bike,
    });
  } catch (error) {
    console.error("Update bike error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
