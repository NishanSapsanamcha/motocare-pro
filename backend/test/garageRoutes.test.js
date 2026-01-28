import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const makeToken = (role = "ADMIN") =>
  jwt.sign({ id: "admin-123", role }, process.env.JWT_SECRET);

const mockHandler = (name) => (req, res) => {
  res.status(200).json({ ok: true, route: name });
};

jest.unstable_mockModule("../middleware/admin.js", () => ({
  adminRequired: (req, res, next) => {
    if (req.userRole !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }
    return next();
  },
}));

jest.unstable_mockModule("../config/multer.js", () => ({
  default: {
    single: () => (req, res, next) => next(),
  },
}));

jest.unstable_mockModule("../controller/admin/garageController.js", () => ({
  getAllGarages: mockHandler("getAllGarages"),
  createGarage: mockHandler("createGarage"),
  updateGarage: mockHandler("updateGarage"),
  deleteGarage: mockHandler("deleteGarage"),
  approveGarage: mockHandler("approveGarage"),
  rejectGarage: mockHandler("rejectGarage"),
  getGarageById: mockHandler("getGarageById"),
}));

let app;

beforeAll(async () => {
  const { default: garageRoutes } = await import("../route/admin/garageRoutes.js");
  app = express();
  app.use(express.json());
  app.use("/api/admin/garages", garageRoutes);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Admin garage routes", () => {
  it("GET /api/admin/garages returns 401 without auth", async () => {
    await request(app).get("/api/admin/garages").expect(401);
  });

  it("GET /api/admin/garages returns 403 for non-admin", async () => {
    await request(app)
      .get("/api/admin/garages")
      .set("Authorization", `Bearer ${makeToken("USER")}`)
      .expect(403);
  });

  it("GET /api/admin/garages returns data with admin auth", async () => {
    const response = await request(app)
      .get("/api/admin/garages")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .expect(200);
    expect(response.body.route).toBe("getAllGarages");
  });

  const authedRoutes = [
    { method: "post", path: "/api/admin/garages", route: "createGarage" },
    { method: "get", path: "/api/admin/garages/garage-1", route: "getGarageById" },
    { method: "put", path: "/api/admin/garages/garage-1", route: "updateGarage" },
    { method: "delete", path: "/api/admin/garages/garage-1", route: "deleteGarage" },
    { method: "patch", path: "/api/admin/garages/garage-1/approve", route: "approveGarage" },
    { method: "patch", path: "/api/admin/garages/garage-1/reject", route: "rejectGarage" },
  ];

  test.each(authedRoutes)("route %s %s works with admin auth", async ({ method, path, route }) => {
    const response = await request(app)
      [method](path)
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .send({})
      .expect(200);
    expect(response.body.route).toBe(route);
  });
});
