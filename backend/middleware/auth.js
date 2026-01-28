import jwt from "jsonwebtoken";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization required" });
  }

  try {
    const JWT_SECRET = requireEnv("JWT_SECRET");
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const adminRequired = (req, res, next) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization required" });
  }

  try {
    const JWT_SECRET = requireEnv("JWT_SECRET");
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};