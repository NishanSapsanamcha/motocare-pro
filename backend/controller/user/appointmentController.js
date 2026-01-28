import { Op } from "sequelize";
import Appointment from "../../models/appointment/Appointment.js";
import Bike from "../../models/bike/Bike.js";
import Garage from "../../models/garage/Garage.js";
import {
  APPOINTMENT_STATUS,
  ACTOR,
  applyTransition,
  canTransition,
  normalizeStatus,
} from "../../utils/appointmentStatus.js";

const isPastDate = (dateStr) => {
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(dateStr);
  return target < localToday;
};

const isPastTimeSlot = (dateStr, timeSlot) => {
  if (!/^\d{2}:\d{2}$/.test(timeSlot)) return true;
  const [h, m] = timeSlot.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return true;
  const now = new Date();
  const target = new Date(dateStr);
  target.setHours(h, m, 0, 0);
  return target < now;
};

const MAX_PER_SLOT = parseInt(process.env.APPOINTMENT_MAX_PER_SLOT || "4", 10);
const ACTIVE_STATUSES = [
  APPOINTMENT_STATUS.REQUESTED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.RESCHEDULED,
];

export const createAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const existing = await Appointment.findOne({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
    const terminalStatuses = [
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.REJECTED,
      APPOINTMENT_STATUS.COMPLETED,
      APPOINTMENT_STATUS.NO_SHOW,
      APPOINTMENT_STATUS.EXPIRED,
    ];
    if (existing && !terminalStatuses.includes(existing.status)) {
      return res.status(409).json({ message: "You can only have one active appointment" });
    }
    const {
      bikeId,
      garageId,
      kmRunning,
      serviceType,
      preferredDate,
      timeSlot,
      notes,
    } = req.body;

    if (!bikeId || !garageId || !kmRunning || !preferredDate || !timeSlot) {
      return res.status(400).json({ message: "Bike, garage, km running, service type, date, and time slot are required" });
    }

    const bike = await Bike.findOne({ where: { id: bikeId, user_id: userId } });
    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    const garage = await Garage.findOne({
      where: { id: garageId, status: "APPROVED", is_deleted: false },
    });
    if (!garage) {
      return res.status(404).json({ message: "Garage not available" });
    }

    if (isPastDate(preferredDate)) {
      return res.status(400).json({ message: "Date cannot be in the past" });
    }
    if (isPastTimeSlot(preferredDate, timeSlot)) {
      return res.status(400).json({ message: "Time slot cannot be in the past" });
    }

    const existingInSlot = await Appointment.count({
      where: {
        garage_id: garageId,
        preferred_date: preferredDate,
        time_slot: timeSlot,
        status: { [Op.in]: ACTIVE_STATUSES },
      },
    });
    if (existingInSlot >= MAX_PER_SLOT) {
      return res.status(409).json({ message: "Selected time slot is fully booked" });
    }

    const appointment = await Appointment.create({
      user_id: userId,
      bike_id: bikeId,
      garage_id: garageId,
      km_running: parseInt(kmRunning, 10),
      service_type: serviceType ? String(serviceType).trim() : "General Service",
      preferred_date: preferredDate,
      time_slot: timeSlot,
      notes: notes ? String(notes).trim() : null,
      status: APPOINTMENT_STATUS.REQUESTED,
      status_history: [
        {
          from: APPOINTMENT_STATUS.DRAFT,
          to: APPOINTMENT_STATUS.REQUESTED,
          by: userId,
          role: ACTOR.CUSTOMER,
          at: new Date().toISOString(),
        },
      ],
    });

    return res.status(201).json({
      message: "Appointment created",
      data: appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getSlotAvailability = async (req, res) => {
  try {
    const { garageId, date } = req.query || {};
    if (!garageId || !date) {
      return res.status(400).json({ message: "garageId and date are required" });
    }

    const rows = await Appointment.findAll({
      where: {
        garage_id: garageId,
        preferred_date: date,
        status: { [Op.in]: ACTIVE_STATUSES },
      },
      attributes: ["time_slot"],
    });

    const counts = rows.reduce((acc, row) => {
      const slot = row.time_slot;
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      message: "Availability fetched",
      data: {
        date,
        garageId,
        maxPerSlot: MAX_PER_SLOT,
        counts,
      },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const listMyAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const appointments = await Appointment.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      include: [
        { association: "garage", attributes: ["id", "name", "address", "phone"] },
        { association: "bike", attributes: ["id", "company", "model", "registration_no"] },
        {
          association: "invoice",
          attributes: [
            "id",
            "total_amount",
            "redeemed_points",
            "redeemed_amount",
            "paid_amount",
            "status",
            "issued_at",
            "paid_at",
          ],
          include: [
            {
              association: "items",
              attributes: ["id", "description", "unit_price", "quantity", "line_total"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      message: "Appointments fetched",
      data: appointments,
    });
  } catch (error) {
    console.error("List appointments error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      where: { id, user_id: userId },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return res.status(400).json({ message: "Appointment already cancelled" });
    }

    const currentStatus = normalizeStatus(appointment.status);
    if (currentStatus !== appointment.status) {
      appointment.status = currentStatus;
    }

    const check = canTransition(currentStatus, APPOINTMENT_STATUS.CANCELLED, ACTOR.CUSTOMER);
    if (!check.allowed) {
      return res.status(400).json({
        message: `Invalid status transition: ${currentStatus} -> ${APPOINTMENT_STATUS.CANCELLED}.`,
      });
    }

    applyTransition({
      appointment,
      toStatus: APPOINTMENT_STATUS.CANCELLED,
      actorRole: ACTOR.CUSTOMER,
      actorId: userId,
      reason: req.body?.reason,
    });
    await appointment.save();

    return res.status(200).json({
      message: "Appointment cancelled",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
