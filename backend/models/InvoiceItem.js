import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";
import Invoice from "./Invoice.js";

const InvoiceItem = sequelize.define(
  "InvoiceItem",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    line_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: "invoice_items",
    timestamps: false,
  }
);

InvoiceItem.belongsTo(Invoice, { foreignKey: "invoice_id", as: "invoice" });
Invoice.hasMany(InvoiceItem, { foreignKey: "invoice_id", as: "items" });

export default InvoiceItem;
