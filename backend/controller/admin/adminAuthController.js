import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/user/Users.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

/**
 * ADMIN LOGIN
 * POST /api/admin/auth/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail, role: "ADMIN" },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: "Admin account is blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * ADMIN REGISTER - PROTECTED (Only existing admins can create new admins)
 * POST /api/admin/auth/register
 */
export const adminRegister = async (req, res) => {
  try {
    const { fullName, email, password, createdByAdminId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify creator is admin
    const creator = await User.findOne({
      where: { id: createdByAdminId, role: "ADMIN" },
    });

    if (!creator) {
      return res.status(403).json({ message: "Only admins can create new admins" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await User.create({
      full_name: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
    });

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
      { id: newAdmin.id, role: newAdmin.role, email: newAdmin.email },
      JWT_SECRET,
      { expiresIn }
    );

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id: newAdmin.id,
        fullName: newAdmin.full_name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Admin register error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * GET ADMIN PROFILE
 * GET /api/admin/auth/me
 */
export const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.userId, role: "ADMIN" },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin profile fetched",
      admin: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};