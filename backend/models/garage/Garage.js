import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";
import User from "../user/Users.js";

const Garage = sequelize.define(
  "Garage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    photo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    services_offered: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: true,
    },
    opening_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    location_coords: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      defaultValue: "PENDING",
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
    tableName: "garages",
    timestamps: false,
  }
);

Garage.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
User.hasMany(Garage, { foreignKey: "owner_id", as: "garages" });

export default Garage;
