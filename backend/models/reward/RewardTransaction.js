import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import User from "../user/Users.js";
import Appointment from "../appointment/Appointment.js";

const RewardTransaction = sequelize.define(
  "RewardTransaction",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("EARN", "REDEEM", "ADJUST"),
      allowNull: false,
      defaultValue: "EARN",
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "reward_transactions",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "appointment_id", "type"],
      },
    ],
  }
);

RewardTransaction.belongsTo(User, { foreignKey: "user_id", as: "user" });
RewardTransaction.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });
User.hasMany(RewardTransaction, { foreignKey: "user_id", as: "rewardTransactions" });
Appointment.hasMany(RewardTransaction, { foreignKey: "appointment_id", as: "rewardTransactions" });

export default RewardTransaction;
