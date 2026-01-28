import RewardTransaction from "../../models/reward/RewardTransaction.js";

export const getMyRewards = async (req, res) => {
  try {
    const userId = req.userId;
    const [earned, redeemed] = await Promise.all([
      RewardTransaction.sum("points", { where: { user_id: userId, type: "EARN" } }),
      RewardTransaction.sum("points", { where: { user_id: userId, type: "REDEEM" } }),
    ]);
    const balance = Number(earned || 0) - Number(redeemed || 0);

    const txns = await RewardTransaction.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    return res.status(200).json({
      message: "Rewards fetched",
      data: {
        balance,
        earned: Number(earned || 0),
        redeemed: Number(redeemed || 0),
        transactions: txns,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
