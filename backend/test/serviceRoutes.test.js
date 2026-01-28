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

jest.unstable_mockModule("../controller/admin/serviceController.js", () => ({
  getAllServiceRequests: mockHandler("getAllServiceRequests"),
  getServiceRequestById: mockHandler("getServiceRequestById"),
  assignServiceToGarage: mockHandler("assignServiceToGarage"),
  updateServiceStatus: mockHandler("updateServiceStatus"),
  getServiceHistory: mockHandler("getServiceHistory"),
  deleteServiceRequest: mockHandler("deleteServiceRequest"),
}));

let app;

beforeAll(async () => {
  const { default: serviceRoutes } = await import("../route/admin/serviceRoutes.js");
  app = express();
  app.use(express.json());
  app.use("/api/admin/services", serviceRoutes);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Admin service routes", () => {
  it("GET /api/admin/services returns 401 without auth", async () => {
    await request(app).get("/api/admin/services").expect(401);
  });

  it("GET /api/admin/services returns 403 for non-admin", async () => {
    await request(app)
      .get("/api/admin/services")
      .set("Authorization", `Bearer ${makeToken("USER")}`)
      .expect(403);
  });

  it("GET /api/admin/services returns data with admin auth", async () => {
    const response = await request(app)
      .get("/api/admin/services")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`)
      .expect(200);
    expect(response.body.route).toBe("getAllServiceRequests");
  });

  const authedRoutes = [
    { method: "get", path: "/api/admin/services/svc-1", route: "getServiceRequestById" },
    { method: "get", path: "/api/admin/services/svc-1/history", route: "getServiceHistory" },
    { method: "patch", path: "/api/admin/services/svc-1/assign", route: "assignServiceToGarage" },
    { method: "patch", path: "/api/admin/services/svc-1/status", route: "updateServiceStatus" },
    { method: "delete", path: "/api/admin/services/svc-1", route: "deleteServiceRequest" },
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
