import { Op } from "sequelize";
import Appointment from "../../models/appointment/Appointment.js";
import Invoice from "../../models/Invoice.js";
import InvoiceItem from "../../models/InvoiceItem.js";
import { awardServicePoints } from "../../utils/rewards.js";

export const listAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      if (status === "REQUESTED") {
        whereClause.status = { [Op.in]: ["REQUESTED", "PENDING"] };
      } else {
        whereClause.status = status;
      }
    }

    if (search) {
      const like = `%${search}%`;
      whereClause[Op.or] = [
        { service_type: { [Op.iLike]: like } },
        { "$user.full_name$": { [Op.iLike]: like } },
        { "$user.email$": { [Op.iLike]: like } },
        { "$garage.name$": { [Op.iLike]: like } },
        { "$bike.registration_no$": { [Op.iLike]: like } },
      ];
    }

    const { count, rows } = await Appointment.findAndCountAll({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [["created_at", "DESC"]],
      where: whereClause,
      distinct: true,
      subQuery: false,
      include: [
        { association: "user", attributes: ["id", "full_name", "email", "phone_number"] },
        { association: "bike", attributes: ["id", "company", "model", "registration_no", "color"] },
        { association: "garage", attributes: ["id", "name", "address", "phone"] },
        {
          association: "invoice",
          attributes: [
            "id",
            "total_amount",
            "subtotal_amount",
            "vat_rate",
            "vat_amount",
            "redeemed_points",
            "redeemed_amount",
            "paid_amount",
            "status",
            "issued_at",
            "paid_at",
          ],
          include: [{ association: "items", attributes: ["id", "description", "unit_price", "quantity", "line_total"] }],
        },
      ],
    });

    return res.status(200).json({
      message: "Appointments fetched",
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("List appointments error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getSlotOccupancy = async (req, res) => {
  try {
    const { date = "", garageId = "" } = req.query;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const where = {
      preferred_date: date,
      status: {
        [Op.in]: ["REQUESTED", "CONFIRMED", "RESCHEDULED"],
      },
    };
    if (garageId) {
      where.garage_id = garageId;
    }

    const rows = await Appointment.findAll({
      where,
      attributes: ["time_slot", [Appointment.sequelize.fn("COUNT", Appointment.sequelize.col("id")), "count"]],
      group: ["time_slot"],
    });

    const counts = rows.reduce((acc, row) => {
      acc[row.time_slot] = Number(row.get("count") || 0);
      return acc;
    }, {});

    const maxPerSlot = parseInt(process.env.APPOINTMENT_MAX_PER_SLOT || "2", 10);

    return res.status(200).json({
      message: "Slot occupancy fetched",
      data: {
        date,
        garageId: garageId || null,
        maxPerSlot,
        counts,
      },
    });
  } catch (error) {
    console.error("Slot occupancy error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateAppointmentPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { quoted_price } = req.body || {};

    const price = Number(quoted_price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: "Valid quoted price is required" });
    }

    const appointment = await Appointment.findByPk(id, {
      include: [{ association: "invoice" }],
    });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.invoice && ["ISSUED", "PAYMENT_PENDING", "PAID"].includes(appointment.invoice.status)) {
      return res.status(400).json({ message: "Price is locked after invoice is issued" });
    }

    appointment.quoted_price = price;
    appointment.updated_at = new Date();
    appointment.updated_by = req.userId;
    await appointment.save();

    if (appointment.invoice && appointment.invoice.status === "DRAFT") {
      const itemsCount = await InvoiceItem.count({ where: { invoice_id: appointment.invoice.id } });
      if (itemsCount === 0) {
        appointment.invoice.total_amount = price;
        appointment.invoice.subtotal_amount = price;
        appointment.invoice.vat_rate = 0;
        appointment.invoice.vat_amount = 0;
        appointment.invoice.updated_by = req.userId;
        appointment.invoice.updated_at = new Date();
        await appointment.invoice.save();
      }
    }

    return res.status(200).json({
      message: "Appointment price updated",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment price error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const createAppointmentInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, items, vat_rate } = req.body || {};

    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.quoted_price === null || appointment.quoted_price === undefined) {
      return res.status(400).json({ message: "Set a quoted price before creating an invoice" });
    }

    const existing = await Invoice.findOne({ where: { appointment_id: id } });
    if (existing) {
      return res.status(409).json({ message: "Invoice already exists" });
    }

    const allowed = ["DRAFT", "ISSUED", "PAYMENT_PENDING", "PAID"];
    const nextStatus = status && allowed.includes(status) ? status : "DRAFT";

    const safeItems = Array.isArray(items) ? items : [];
    const parsedItems = safeItems
      .map((item) => ({
        description: String(item.description || "").trim(),
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity || 1),
      }))
      .filter((item) => item.description && Number.isFinite(item.unit_price) && item.unit_price >= 0);

    const vatRate = Number(vat_rate);
    const normalizedVat = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 0;
    const subtotal = parsedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const vatAmount = (subtotal * normalizedVat) / 100;
    const totalAmount = subtotal + vatAmount;

    const effectiveTotal = parsedItems.length ? totalAmount : Number(appointment.quoted_price);
    if (["ISSUED", "PAYMENT_PENDING", "PAID"].includes(nextStatus) && (!Number.isFinite(effectiveTotal) || effectiveTotal <= 0)) {
      return res.status(400).json({ message: "Invoice amount must be greater than 0" });
    }

    const invoice = await Invoice.create({
      appointment_id: id,
      total_amount: parsedItems.length ? totalAmount : appointment.quoted_price,
      subtotal_amount: parsedItems.length ? subtotal : appointment.quoted_price,
      vat_rate: parsedItems.length ? normalizedVat : 0,
      vat_amount: parsedItems.length ? vatAmount : 0,
      redeemed_points: 0,
      redeemed_amount: 0,
      paid_amount: null,
      status: nextStatus,
      issued_at: ["ISSUED", "PAYMENT_PENDING", "PAID"].includes(nextStatus) ? new Date() : null,
      paid_at: nextStatus === "PAID" ? new Date() : null,
      created_by: req.userId,
      updated_by: req.userId,
    });

    if (parsedItems.length) {
      const itemRows = parsedItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.unit_price * item.quantity,
      }));
      await InvoiceItem.bulkCreate(itemRows);
    }

    if (nextStatus === "PAID") {
      await awardServicePoints({ appointment, invoice });
    }

    return res.status(201).json({
      message: "Invoice created",
      data: invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
