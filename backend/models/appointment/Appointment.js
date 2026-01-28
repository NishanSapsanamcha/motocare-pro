import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import Bike from "../bike/Bike.js";
import Garage from "../garage/Garage.js";
import User from "../user/Users.js";

const Appointment = sequelize.define(
  "Appointment",
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
    bike_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    garage_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    km_running: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "General Service",
    },
    preferred_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time_slot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quoted_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "REQUESTED",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "RESCHEDULED",
        "COMPLETED",
        "NO_SHOW",
        "EXPIRED"
      ),
      defaultValue: "REQUESTED",
    },
    status_history: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    decided_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    decided_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reschedule_from: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reschedule_to: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    internal_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "appointments",
    timestamps: false,
  }
);

Appointment.belongsTo(User, { foreignKey: "user_id", as: "user" });
Appointment.belongsTo(Bike, { foreignKey: "bike_id", as: "bike" });
Appointment.belongsTo(Garage, { foreignKey: "garage_id", as: "garage" });

export default Appointment;
