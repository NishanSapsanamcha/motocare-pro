import { Op } from "sequelize";
import Appointment from "../models/appointment/Appointment.js";

export const APPOINTMENT_STATUS = {
  DRAFT: "DRAFT",
  REQUESTED: "REQUESTED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  RESCHEDULED: "RESCHEDULED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  EXPIRED: "EXPIRED",
};

const ACTOR_ROLE = {
  CUSTOMER: "CUSTOMER",
  PROVIDER: "PROVIDER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
};

const TRANSITIONS = {
  [APPOINTMENT_STATUS.DRAFT]: {
    [APPOINTMENT_STATUS.REQUESTED]: [ACTOR_ROLE.CUSTOMER],
  },
  [APPOINTMENT_STATUS.REQUESTED]: {
    [APPOINTMENT_STATUS.CONFIRMED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.REJECTED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.CANCELLED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.CUSTOMER],
    [APPOINTMENT_STATUS.EXPIRED]: [ACTOR_ROLE.SYSTEM],
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    [APPOINTMENT_STATUS.CANCELLED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.CUSTOMER, ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.RESCHEDULED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.NO_SHOW]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.COMPLETED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.PROVIDER],
  },
  [APPOINTMENT_STATUS.RESCHEDULED]: {
    [APPOINTMENT_STATUS.CONFIRMED]: [ACTOR_ROLE.PROVIDER],
    [APPOINTMENT_STATUS.CANCELLED]: [ACTOR_ROLE.ADMIN, ACTOR_ROLE.CUSTOMER],
  },
};

export const resolveActorRole = ({ userRole, userId }, appointment) => {
  if (userRole === "ADMIN") return ACTOR_ROLE.ADMIN;
  if (appointment.user_id === userId) return ACTOR_ROLE.CUSTOMER;
  return null;
};

export const canTransition = (fromStatus, toStatus, actorRole) => {
  const allowed = TRANSITIONS[fromStatus]?.[toStatus];
  if (!allowed) return { allowed: false, type: "invalid" };
  if (!allowed.includes(actorRole)) return { allowed: false, type: "forbidden" };
  return { allowed: true };
};

export const normalizeStatus = (status) => {
  if (status === "PENDING") return APPOINTMENT_STATUS.REQUESTED;
  return status;
};

const buildScheduleDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  return new Date(`${dateStr}T${timeStr}:00`);
};

export const applyTransition = ({
  appointment,
  toStatus,
  actorRole,
  actorId,
  reason,
  note,
  rescheduleFrom,
  rescheduleTo,
}) => {
  const fromStatus = appointment.status;
  appointment.status = toStatus;
  appointment.updated_at = new Date();
  appointment.updated_by = actorId || null;

  if (toStatus === APPOINTMENT_STATUS.CONFIRMED || toStatus === APPOINTMENT_STATUS.REJECTED) {
    appointment.decided_by = actorId || null;
    appointment.decided_at = new Date();
  }

  if (toStatus === APPOINTMENT_STATUS.CANCELLED) {
    appointment.cancellation_reason = reason || null;
  }

  if (toStatus === APPOINTMENT_STATUS.RESCHEDULED) {
    appointment.reschedule_from = rescheduleFrom || buildScheduleDate(appointment.preferred_date, appointment.time_slot);
    appointment.reschedule_to = rescheduleTo || null;
  }

  if (actorRole === ACTOR_ROLE.ADMIN && note) {
    appointment.internal_notes = note;
  }

  const historyEntry = {
    from: fromStatus,
    to: toStatus,
    by: actorId || null,
    role: actorRole,
    at: new Date().toISOString(),
    reason: reason || undefined,
    note: note || undefined,
  };

  const history = Array.isArray(appointment.status_history) ? appointment.status_history : [];
  appointment.status_history = [...history, historyEntry];
};

export const expireStaleAppointments = async () => {
  const expiryHours = parseInt(process.env.APPOINTMENT_REQUEST_EXPIRY_HOURS || "6", 10);
  const cutoff = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

  const stale = await Appointment.findAll({
    where: {
      status: {
        [Op.in]: [APPOINTMENT_STATUS.REQUESTED, "PENDING"],
      },
      created_at: { [Op.lt]: cutoff },
    },
  });

  for (const appointment of stale) {
    applyTransition({
      appointment,
      toStatus: APPOINTMENT_STATUS.EXPIRED,
      actorRole: ACTOR_ROLE.SYSTEM,
      actorId: null,
    });
    await appointment.save();
  }
};

export const ACTOR = ACTOR_ROLE;
