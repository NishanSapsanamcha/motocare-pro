import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./route/auth/authRoutes.js";
import userRoutes from "./route/user/userRoutes.js";
import adminAuthRoutes from "./route/admin/adminAuthRoutes.js";
import adminGarageRoutes from "./route/admin/garageRoutes.js";
import adminServiceRoutes from "./route/admin/serviceRoutes.js";
import adminUserRoutes from "./route/admin/userRoutes.js";
import adminSalesRoutes from "./route/admin/salesRoutes.js";
import adminAppointmentRoutes from "./route/admin/appointmentRoutes.js";
import adminInvoiceRoutes from "./route/admin/invoiceRoutes.js";
import appointmentRoutes from "./route/appointmentRoutes.js";
import { expireStaleAppointments } from "./utils/appointmentStatus.js";

// DB
import sequelize from "./database/db.js";
import "./models/bike/Bike.js";
import "./models/appointment/Appointment.js";
import "./models/Invoice.js";
import "./models/InvoiceItem.js";
import "./models/reward/RewardTransaction.js";
import { runMigrations } from "./utils/migrations.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);

// Admin Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/garages", adminGarageRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/sales", adminSalesRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
app.use("/api/admin/invoices", adminInvoiceRoutes);

// API root
app.get("/api", (req, res) => {
  res.json({ message: "Motocare Pro API is running" });
});

// Test route
app.get("/", (req, res) => {
  res.send("Motocare Pro API is running");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ message: "Internal server error" });
});

// Server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connected");
    const isProd = process.env.NODE_ENV === "production";
    if (isProd || process.env.RUN_MIGRATIONS === "true") {
      await runMigrations(sequelize);
      console.log("✓ Migrations applied");
    } else {
      await sequelize.sync({ alter: true });
      console.log("✓ Database synced");
    }

    const expiryIntervalMinutes = parseInt(process.env.APPOINTMENT_EXPIRY_CHECK_MINUTES || "5", 10);
    await expireStaleAppointments();
    setInterval(() => {
      expireStaleAppointments().catch((error) => {
        console.error("Appointment expiry job failed:", error);
      });
    }, expiryIntervalMinutes * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("✗ DB connection failed:", error);
    process.exit(1);
  }
})();

export default app;
