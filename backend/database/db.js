import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config(); // ✅ make sure DATABASE_URL is loaded here

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check your backend .env location.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
