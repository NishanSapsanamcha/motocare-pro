import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import ServiceRequest from "../service/ServiceRequest.js";

const Sale = sequelize.define(
  "Sale",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    service_request_id: {
      type: DataTypes.INTEGER,
      references: {
        model: ServiceRequest,
        key: "id",
      },
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM("CASH", "CARD", "TRANSFER"),
      defaultValue: "CASH",
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: "sales",
    timestamps: false,
  }
);

Sale.belongsTo(ServiceRequest, { foreignKey: "service_request_id", as: "serviceRequest" });
ServiceRequest.hasOne(Sale, { foreignKey: "service_request_id", as: "sale" });

export default Sale;