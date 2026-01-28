import Invoice from "../../models/Invoice.js";
import Appointment from "../../models/appointment/Appointment.js";
import InvoiceItem from "../../models/InvoiceItem.js";
import Garage from "../../models/garage/Garage.js";
import User from "../../models/user/Users.js";
import Bike from "../../models/bike/Bike.js";
import RewardTransaction from "../../models/reward/RewardTransaction.js";
import { awardServicePoints, computeRedeemablePoints } from "../../utils/rewards.js";

export const payInvoice = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { redeem_points } = req.body || {};

    const invoice = await Invoice.findByPk(id, {
      include: [{ model: Appointment, as: "appointment" }],
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const appointment = invoice.appointment;
    if (!appointment || appointment.user_id !== userId) {
      return res.status(403).json({ message: "Not allowed to pay this invoice" });
    }

    if (invoice.status === "PAID") {
      return res.status(400).json({ message: "Invoice already paid" });
    }
    if (invoice.status === "CANCELLED") {
      return res.status(400).json({ message: "Cancelled invoices cannot be paid" });
    }
    if (invoice.status !== "ISSUED") {
      return res.status(400).json({ message: "Invoice must be issued before payment" });
    }

    const points = redeem_points ? Number(redeem_points) : 0;
    if (!Number.isInteger(points) || points < 0) {
      return res.status(400).json({ message: "Redeem points must be a positive integer" });
    }

    let redeemedAmount = 0;
    if (points > 0) {
      if (points < 100) {
        return res.status(400).json({ message: "Minimum redeemable points is 100" });
      }

      const [earned, redeemed] = await Promise.all([
        RewardTransaction.sum("points", { where: { user_id: userId, type: "EARN" } }),
        RewardTransaction.sum("points", { where: { user_id: userId, type: "REDEEM" } }),
      ]);
      const balance = Number(earned || 0) - Number(redeemed || 0);
      const maxAllowed = computeRedeemablePoints({
        balance,
        invoiceTotal: invoice.total_amount,
      });
      if (points > maxAllowed) {
        return res.status(400).json({ message: "Redeem points exceed allowed limit" });
      }

      redeemedAmount = points;
    }

    invoice.redeemed_points = points;
    invoice.redeemed_amount = redeemedAmount;
    invoice.paid_amount = null;
    invoice.status = "PAYMENT_PENDING";
    await invoice.save();

    return res.status(200).json({
      message: "Payment request submitted",
      data: invoice,
    });
  } catch (error) {
    console.error("Pay invoice error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getInvoicePrintView = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Appointment,
          as: "appointment",
          include: [
            { model: Garage, as: "garage", attributes: ["name", "address", "phone", "email"] },
            { model: User, as: "user", attributes: ["full_name", "email", "phone_number"] },
            { model: Bike, as: "bike", attributes: ["company", "model", "registration_no"] },
          ],
        },
        { model: InvoiceItem, as: "items" },
      ],
    });

    if (!invoice) return res.status(404).send("Invoice not found");
    if (!invoice.appointment || invoice.appointment.user_id !== userId) {
      return res.status(403).send("Not allowed");
    }

    const appt = invoice.appointment;
    const garage = appt.garage;
    const user = appt.user;
    const items = Array.isArray(invoice.items) ? invoice.items : [];

    const totalValue = Number(invoice.total_amount || 0);
    const total = totalValue.toFixed(2);
    const redeemed = Number(invoice.redeemed_amount || 0).toFixed(2);
    const paidAmount = Number(invoice.paid_amount ?? invoice.total_amount ?? 0).toFixed(2);
    const issuedAt = invoice.issued_at ? new Date(invoice.issued_at).toLocaleString() : "-";
    const paidAt = invoice.paid_at ? new Date(invoice.paid_at).toLocaleString() : "-";
    const kmRunning = appt?.km_running ?? "-";

    const safe = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const toWords = (num) => {
      const value = Number(num);
      if (!Number.isFinite(value)) return "Zero";
      const integer = Math.floor(value);
      const ones = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
      ];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const toChunk = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
        if (n < 1000) {
          return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + toChunk(n % 100) : ""}`;
        }
        if (n < 1000000) {
          return `${toChunk(Math.floor(n / 1000))} Thousand${n % 1000 ? " " + toChunk(n % 1000) : ""}`;
        }
        if (n < 1000000000) {
          return `${toChunk(Math.floor(n / 1000000))} Million${n % 1000000 ? " " + toChunk(n % 1000000) : ""}`;
        }
        return `${toChunk(Math.floor(n / 1000000000))} Billion${n % 1000000000 ? " " + toChunk(n % 1000000000) : ""}`;
      };
      return toChunk(integer);
    };

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Motocare Pro Invoice</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; background: #ffffff; }
      .page { max-width: 900px; margin: 0 auto; }
      .header { display:flex; justify-content: space-between; align-items:flex-start; gap: 16px; }
      .brand { font-size: 22px; font-weight: 800; color: #ff7a18; }
      .subtitle { color: #6b7280; font-weight: 600; }
      .meta { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; min-width: 220px; }
      .meta .label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: .4px; }
      .section { margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; }
      .section-title { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: .4px; margin-bottom: 6px; }
      .center { text-align: center; }
      .muted { color: #6b7280; }
      .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .customer-col { display: grid; gap: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      th { background: #f9fafb; font-weight: 700; }
      .right { text-align: right; }
      .totals { margin-top: 10px; display: grid; gap: 6px; }
      .totals div { display:flex; justify-content: space-between; }
      .words { margin-top: 10px; font-weight: 700; }
      .signature { margin-top: 18px; display:flex; justify-content: flex-end; }
      .sig-line { border-top: 1px solid #cbd5f5; padding-top: 6px; min-width: 180px; text-align: center; }
      @media print { .no-print { display: none; } }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <div class="brand">Motocare Pro</div>
          <div class="subtitle">Service Invoice</div>
        </div>
        <div class="meta">
          <div><span class="label">Invoice ID</span><br/>${safe(invoice.id)}</div>
          <div style="margin-top:6px;"><span class="label">Issued</span><br/>${issuedAt}</div>
          <div style="margin-top:6px;"><span class="label">Paid</span><br/>${paidAt}</div>
        </div>
      </div>

      <div class="section center">
        <div class="section-title">Garage Details</div>
        <div><strong>${safe(garage?.name || "-")}</strong></div>
        <div class="muted">${safe(garage?.address || "-")}</div>
        <div class="muted">${safe(garage?.phone || "-")}${garage?.email ? " • " + safe(garage.email) : ""}</div>
      </div>

      <div class="section">
        <div class="section-title">Customer</div>
        <div class="customer-grid">
          <div class="customer-col">
            <div class="muted"><strong>Name:</strong> ${safe(user?.full_name || "-")}</div>
            <div class="muted"><strong>Phone No.:</strong> ${safe(user?.phone_number || "-")}</div>
            <div class="muted"><strong>Email:</strong> ${safe(user?.email || "-")}</div>
          </div>
          <div class="customer-col">
            <div class="muted"><strong>Bike:</strong> ${safe(appt.bike?.company || "-")} ${safe(appt.bike?.model || "")}</div>
            <div class="muted"><strong>Bike No:</strong> ${safe(appt.bike?.registration_no || "-")}</div>
            <div class="muted"><strong>KM Running:</strong> ${safe(kmRunning)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service</div>
        <div><strong>${safe(appt.service_type || "Service")}</strong></div>
        <div class="muted">${safe(appt.preferred_date || "-")} at ${safe(appt.time_slot || "-")}</div>
      </div>

      <div class="section">
        <div class="section-title">Invoice Items</div>
        <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="right">Qty</th>
            <th class="right">Unit</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.length ? items.map((item) => `
            <tr>
              <td>${safe(item.description)}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${Number(item.unit_price).toFixed(2)}</td>
              <td class="right">${Number(item.line_total).toFixed(2)}</td>
            </tr>
          `).join("") : `
            <tr><td colspan="4" class="muted">No invoice items.</td></tr>
          `}
        </tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${Number(invoice.subtotal_amount || 0).toFixed(2)}</span></div>
        <div><span>VAT</span><span>${Number(invoice.vat_amount || 0).toFixed(2)}</span></div>
        <div><span>Total</span><span>${total}</span></div>
        <div><span>Redeemed</span><span>${redeemed}</span></div>
        <div><strong>Paid</strong><strong>${paidAmount}</strong></div>
      </div>
      <div class="words">Amount in Words: ${safe(toWords(totalValue))} Only</div>
    </div>
      <div class="signature">
        <div class="sig-line">Signature</div>
      </div>

      <div class="section no-print">
        <button onclick="window.print()">Download PDF</button>
      </div>
    </div>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Invoice print error:", error);
    return res.status(500).send("Server error");
  }
};
