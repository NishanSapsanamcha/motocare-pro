import RewardTransaction from "../models/reward/RewardTransaction.js";

export const calculateServicePoints = (amount) => {
  const safe = Number(amount);
  if (!Number.isFinite(safe) || safe <= 0) return 0;
  return Math.min(1000, Math.floor(safe * 0.5));
};

export const awardServicePoints = async ({ appointment, invoice }) => {
  if (!appointment || appointment.status !== "COMPLETED") return null;
  const amount = invoice?.total_amount ?? appointment.quoted_price;
  const points = calculateServicePoints(amount);
  if (!points) return null;

  const [tx, created] = await RewardTransaction.findOrCreate({
    where: {
      user_id: appointment.user_id,
      appointment_id: appointment.id,
      type: "EARN",
    },
    defaults: {
      points,
      note: "Service completed reward",
    },
  });

  return created ? tx : null;
};

export const computeRedeemablePoints = ({ balance, invoiceTotal }) => {
  const total = Number(invoiceTotal);
  const safeBalance = Number(balance);
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(safeBalance) || safeBalance <= 0) return 0;
  const maxByAmount = Math.floor(total * 0.5);
  const maxAllowed = Math.max(0, Math.min(safeBalance, maxByAmount));
  if (maxAllowed < 100) return 0;
  return maxAllowed;
};
