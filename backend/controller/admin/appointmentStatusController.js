import Appointment from "../../models/appointment/Appointment.js";
import { awardServicePoints } from "../../utils/rewards.js";
import {
  APPOINTMENT_STATUS,
  ACTOR,
  normalizeStatus,
  resolveActorRole,
  canTransition,
  applyTransition,
} from "../../utils/appointmentStatus.js";

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, reschedule_from, reschedule_to, note } = req.body || {};

    if (!status || !APPOINTMENT_STATUS[status]) {
      return res.status(400).json({ message: "Invalid or missing status" });
    }

    const appointment = await Appointment.findByPk(id, {
      include: [
        { association: "garage", attributes: ["id", "owner_id"] },
        { association: "invoice", attributes: ["id", "status", "total_amount", "paid_at"] },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const actorRole = resolveActorRole(
      { userRole: req.userRole, userId: req.userId },
      appointment
    );

    if (!actorRole) {
      return res.status(403).json({ message: "Not authorized for this appointment" });
    }

    const currentStatus = normalizeStatus(appointment.status);
    if (currentStatus !== appointment.status) {
      appointment.status = currentStatus;
    }

    const check = canTransition(currentStatus, status, actorRole);
    if (!check.allowed) {
      if (check.type === "forbidden") {
        return res.status(403).json({ message: "You are not allowed to perform this status change" });
      }
      return res.status(400).json({
        message: `Invalid status transition: ${currentStatus} -> ${status}.`,
      });
    }

    if (status === APPOINTMENT_STATUS.CANCELLED && actorRole === ACTOR.ADMIN && !reason) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    if (status === APPOINTMENT_STATUS.RESCHEDULED && !reschedule_to) {
      return res.status(400).json({ message: "Reschedule time is required" });
    }

    applyTransition({
      appointment,
      toStatus: status,
      actorRole,
      actorId: req.userId,
      reason,
      note,
      rescheduleFrom: parseDate(reschedule_from),
      rescheduleTo: parseDate(reschedule_to),
    });

    await appointment.save();

    if (status === APPOINTMENT_STATUS.COMPLETED && appointment.invoice?.status === "PAID") {
      await awardServicePoints({ appointment, invoice: appointment.invoice });
    }

    return res.status(200).json({
      message: "Appointment status updated",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
