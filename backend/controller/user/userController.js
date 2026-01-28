import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import User from "../../models/user/Users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.join(__dirname, "../../uploads/profiles");
const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = parseInt(process.env.PROFILE_IMAGE_MAX_BYTES || "2097152", 10); // 2MB default

const parseBase64Image = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const base64 = match[2];
  return { mime, base64 };
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, email, phoneNumber } = req.body;

    if (fullName === undefined && email === undefined && phoneNumber === undefined) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Full name is required" });
      }
      updates.full_name = trimmed;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ message: "Email already in use" });
      }

      updates.email = normalizedEmail;
    }

    if (phoneNumber !== undefined) {
      const trimmed = String(phoneNumber).trim();
      updates.phone_number = trimmed === "" ? null : trimmed;
    }

    await user.update(updates);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const updateMyAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    const { imageData } = req.body || {};
    const parsed = parseBase64Image(imageData);
    if (!parsed) {
      return res.status(400).json({ message: "Invalid image data" });
    }
    if (!allowedMimes.includes(parsed.mime)) {
      return res.status(400).json({ message: "Unsupported image type" });
    }

    const buffer = Buffer.from(parsed.base64, "base64");
    if (buffer.length > maxBytes) {
      return res.status(400).json({ message: "Image size exceeds limit" });
    }

    const ext = parsed.mime === "image/jpeg" ? "jpg" : parsed.mime.split("/")[1];
    await fs.mkdir(uploadRoot, { recursive: true });
    const filename = `avatar-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadRoot, filename);
    await fs.writeFile(filePath, buffer);

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatar_url && user.avatar_url.startsWith("/uploads/profiles/")) {
      const oldPath = path.join(__dirname, "../../", user.avatar_url);
      fs.unlink(oldPath).catch(() => {});
    }

    const avatarUrl = `/uploads/profiles/${filename}`;
    await user.update({ avatar_url: avatarUrl, updated_at: new Date() });

    return res.status(200).json({
      message: "Profile image updated",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phoneNumber: user.phone_number,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
