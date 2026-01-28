import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import User from "../user/Users.js";
import Garage from "../garage/Garage.js";

const ServiceRequest = sequelize.define(
  "ServiceRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: User,
        key: "id",
      },
      allowNull: false,
    },
    garage_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Garage,
        key: "id",
      },
      allowNull: true,
    },
    vehicle_info: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "ACCEPTED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ),
      defaultValue: "PENDING",
    },
    requested_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completed_date: {
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
    tableName: "service_requests",
    timestamps: false,
  }
);

ServiceRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
ServiceRequest.belongsTo(Garage, { foreignKey: "garage_id", as: "garage" });
User.hasMany(ServiceRequest, { foreignKey: "user_id", as: "serviceRequests" });
Garage.hasMany(ServiceRequest, { foreignKey: "garage_id", as: "serviceRequests" });

export default ServiceRequest;
