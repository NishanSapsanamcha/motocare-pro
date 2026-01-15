import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check your backend .env location.");
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false, // set true if needed sql logs
});

export default sequelize;
 