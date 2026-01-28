import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import ServiceRequest from "./ServiceRequest.js";
import User from "../user/Users.js";

const ServiceStatusHistory = sequelize.define(
  "ServiceStatusHistory",
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
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "ACCEPTED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "id",
      },
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "service_status_history",
    timestamps: false,
  }
);

ServiceStatusHistory.belongsTo(ServiceRequest, { foreignKey: "service_request_id" });
ServiceStatusHistory.belongsTo(User, { foreignKey: "updated_by", as: "updatedByUser" });
ServiceRequest.hasMany(ServiceStatusHistory, { foreignKey: "service_request_id", as: "statusHistory" });

export default ServiceStatusHistory;
