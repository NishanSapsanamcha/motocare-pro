import Invoice from "../../models/Invoice.js";
import Appointment from "../../models/appointment/Appointment.js";
import InvoiceItem from "../../models/InvoiceItem.js";
import RewardTransaction from "../../models/reward/RewardTransaction.js";
import { awardServicePoints, computeRedeemablePoints } from "../../utils/rewards.js";
import Garage from "../../models/garage/Garage.js";
import User from "../../models/user/Users.js";
import Bike from "../../models/bike/Bike.js";

const STATUS = ["DRAFT", "ISSUED", "PAYMENT_PENDING", "PAID", "CANCELLED"];

const normalizeItems = (items) => {
  const safeItems = Array.isArray(items) ? items : [];
  return safeItems
    .map((item) => ({
      description: String(item.description || "").trim(),
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity || 1),
    }))
    .filter((item) => item.description && Number.isFinite(item.unit_price) && item.unit_price >= 0);
};

const calculateTotals = (items, vatRate) => {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount;
  return { subtotal, vatAmount, totalAmount };
};

export const updateInvoiceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, vat_rate } = req.body || {};

    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Appointment, as: "appointment" }],
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (invoice.status !== "DRAFT") {
      return res.status(400).json({ message: "Only draft invoices can be edited" });
    }

    const normalizedVat = Number(vat_rate);
    if (!Number.isFinite(normalizedVat) || normalizedVat < 0) {
      return res.status(400).json({ message: "Valid VAT rate is required" });
    }

    const parsedItems = normalizeItems(items);
    if (!parsedItems.length) {
      return res.status(400).json({ message: "At least one invoice item is required" });
    }

    const { subtotal, vatAmount, totalAmount } = calculateTotals(parsedItems, normalizedVat);

    await InvoiceItem.destroy({ where: { invoice_id: invoice.id } });
    await InvoiceItem.bulkCreate(
      parsedItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.unit_price * item.quantity,
      }))
    );

    invoice.subtotal_amount = subtotal;
    invoice.vat_rate = normalizedVat;
    invoice.vat_amount = vatAmount;
    invoice.total_amount = totalAmount;
    invoice.updated_by = req.userId;
    invoice.updated_at = new Date();
    await invoice.save();

    return res.status(200).json({
      message: "Invoice updated",
      data: invoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, redeem_points } = req.body || {};

    if (!status || !STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid invoice status" });
    }

    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Appointment, as: "appointment" }],
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (status === "ISSUED" && invoice.total_amount <= 0) {
      return res.status(400).json({ message: "Invoice amount must be greater than 0" });
    }
    if (status === "PAYMENT_PENDING" && invoice.total_amount <= 0) {
      return res.status(400).json({ message: "Invoice amount must be greater than 0" });
    }

    if (status === "PAID" && !["ISSUED", "PAYMENT_PENDING"].includes(invoice.status)) {
      return res.status(400).json({ message: "Invoice must be issued before payment" });
    }

    if (status === "CANCELLED" && invoice.status === "PAID") {
      return res.status(400).json({ message: "Paid invoices cannot be cancelled" });
    }

    invoice.status = status;
    invoice.updated_by = req.userId;
    invoice.updated_at = new Date();

    if (status === "ISSUED") {
      invoice.issued_at = invoice.issued_at || new Date();
    }
    if (status === "PAYMENT_PENDING") {
      invoice.issued_at = invoice.issued_at || new Date();
    }
    if (status === "PAID") {
      const appointment = invoice.appointment;
      const points =
        redeem_points !== undefined && redeem_points !== null
          ? Number(redeem_points)
          : Number(invoice.redeemed_points || 0);

      if (points) {
        if (!Number.isInteger(points) || points < 0) {
          return res.status(400).json({ message: "Redeem points must be a positive integer" });
        }
        if (points > 0) {
          const [earned, redeemed] = await Promise.all([
            RewardTransaction.sum("points", { where: { user_id: appointment.user_id, type: "EARN" } }),
            RewardTransaction.sum("points", { where: { user_id: appointment.user_id, type: "REDEEM" } }),
          ]);
          const balance = Number(earned || 0) - Number(redeemed || 0);
          const maxAllowed = computeRedeemablePoints({
            balance,
            invoiceTotal: invoice.total_amount,
          });

          if (points < 100) {
            return res.status(400).json({ message: "Minimum redeemable points is 100" });
          }
          if (points > maxAllowed) {
            return res.status(400).json({ message: "Redeem points exceed allowed limit" });
          }

          await RewardTransaction.findOrCreate({
            where: {
              user_id: appointment.user_id,
              appointment_id: appointment.id,
              type: "REDEEM",
            },
            defaults: {
              points,
              note: `Redeemed at payment for invoice ${invoice.id}`,
            },
          });

          invoice.redeemed_points = points;
          invoice.redeemed_amount = points;
        }
      }

      if (invoice.redeemed_amount === null || invoice.redeemed_amount === undefined) {
        invoice.redeemed_amount = 0;
      }
      if (invoice.redeemed_points === null || invoice.redeemed_points === undefined) {
        invoice.redeemed_points = 0;
      }
      const redeemedAmount = Number(invoice.redeemed_amount || 0);
      invoice.paid_amount = Number(invoice.total_amount || 0) - redeemedAmount;
      invoice.paid_at = new Date();
    }
    if (status === "CANCELLED") {
      invoice.cancelled_at = new Date();
    }

    await invoice.save();

    if (status === "PAID") {
      await awardServicePoints({ appointment: invoice.appointment, invoice });
    }

    return res.status(200).json({
      message: "Invoice status updated",
      data: invoice,
    });
  } catch (error) {
    console.error("Update invoice status error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const listPendingPayments = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { status: "PAYMENT_PENDING" },
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: Appointment,
          as: "appointment",
          include: [
            { model: Garage, as: "garage", attributes: ["id", "name", "address", "phone"] },
            { model: User, as: "user", attributes: ["id", "full_name", "email", "phone_number"] },
            { model: Bike, as: "bike", attributes: ["id", "company", "model", "registration_no"] },
          ],
        },
      ],
    });

    return res.status(200).json({
      message: "Pending payments fetched",
      data: invoices,
    });
  } catch (error) {
    console.error("Pending payments error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
