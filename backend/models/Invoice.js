import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";
import Appointment from "./appointment/Appointment.js";

const Invoice = sequelize.define(
  "Invoice",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    vat_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    vat_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    redeemed_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    redeemed_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "ISSUED", "PAYMENT_PENDING", "PAID", "CANCELLED"),
      defaultValue: "DRAFT",
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
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
    tableName: "invoices",
    timestamps: false,
  }
);

Invoice.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });
Appointment.hasOne(Invoice, { foreignKey: "appointment_id", as: "invoice" });

export default Invoice;
