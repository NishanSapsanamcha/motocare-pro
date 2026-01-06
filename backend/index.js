import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Routes
import authRoutes from "./route/auth/authRoutes.js";
import userRoutes from "./route/user/userRoutes.js";

// DB
import pool from "../backend/database/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Motocare Pro API is running 🚀");
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});