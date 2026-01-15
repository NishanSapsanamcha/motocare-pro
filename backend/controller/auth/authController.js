import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/user/Users.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

/**
 * REGISTER
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      full_name: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * LOGIN
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const JWT_SECRET = requireEnv("JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
