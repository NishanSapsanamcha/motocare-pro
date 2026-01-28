import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../models/user/Users.js";
import { sendResetEmail } from "../../utils/email.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

const getAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) return res.status(409).json({ message: "User already exists" });

    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes(normalizedEmail);

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      full_name: fullName.trim(),
      email: normalizedEmail,
      password: hashed,
      phone_number: phoneNumber || null,
      role: isAdmin ? "ADMIN" : "USER",
      is_blocked: false,
      is_deleted: false,
    });

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        phoneNumber: newUser.phone_number,
        role: newUser.role,
        isBlocked: newUser.is_blocked,
        avatarUrl: newUser.avatar_url,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.is_blocked) return res.status(403).json({ message: "Account is blocked" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        role: user.role,
        isBlocked: user.is_blocked,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        role: user.role,
        isBlocked: user.is_blocked,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(200).json({ message: "If that email exists, a reset link has been sent" });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresInMinutes = parseInt(process.env.RESET_PASSWORD_EXPIRES_MINUTES || "30", 10);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await user.update({
      password_reset_token: tokenHash,
      password_reset_expires: expiresAt,
      password_reset_used_at: null,
      updated_at: new Date(),
    });

    const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    await sendResetEmail({ to: user.email, resetUrl });

    return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const now = new Date();
    const user = await User.findOne({
      where: {
        password_reset_token: tokenHash,
        password_reset_used_at: null,
      },
    });

    if (!user || !user.password_reset_expires || user.password_reset_expires < now) {
      return res.status(400).json({ message: "Reset link is invalid or expired" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await user.update({
      password: hashed,
      password_reset_used_at: now,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: now,
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
