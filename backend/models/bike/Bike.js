import { DataTypes } from "sequelize";
import sequelize from "../../database/db.js";

const Bike = sequelize.define(
  "Bike",
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
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registration_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_new_number: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    new_registration_no: {
      type: DataTypes.STRING,
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
    tableName: "bikes",
    timestamps: false,
  }
);

export default Bike;
