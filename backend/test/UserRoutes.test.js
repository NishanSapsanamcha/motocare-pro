import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { jest } from "@jest/globals";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const makeToken = (role = "USER") =>
  jwt.sign({ id: "user-123", role }, process.env.JWT_SECRET);

const mockHandler = (name) => (req, res) => {
  res.status(200).json({ ok: true, route: name });
};

jest.unstable_mockModule("../controller/user/userController.js", () => ({
  updateMe: mockHandler("updateMe"),
  updateMyAvatar: mockHandler("updateMyAvatar"),
}));

jest.unstable_mockModule("../controller/user/bikeController.js", () => ({
  createBike: mockHandler("createBike"),
  listMyBikes: mockHandler("listMyBikes"),
  updateBike: mockHandler("updateBike"),
}));

jest.unstable_mockModule("../controller/user/garageController.js", () => ({
  listApprovedGarages: mockHandler("listApprovedGarages"),
}));

jest.unstable_mockModule("../controller/user/appointmentController.js", () => ({
  cancelAppointment: mockHandler("cancelAppointment"),
  createAppointment: mockHandler("createAppointment"),
  listMyAppointments: mockHandler("listMyAppointments"),
  getSlotAvailability: mockHandler("getSlotAvailability"),
}));

jest.unstable_mockModule("../controller/user/rewardController.js", () => ({
  getMyRewards: mockHandler("getMyRewards"),
}));

jest.unstable_mockModule("../controller/user/invoiceController.js", () => ({
  getInvoicePrintView: mockHandler("getInvoicePrintView"),
  payInvoice: mockHandler("payInvoice"),
}));

let app;

beforeAll(async () => {
  const { default: userRoutes } = await import("../route/user/userRoutes.js");
  app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("User routes", () => {
  it("GET /api/users returns test route response", async () => {
    const response = await request(app).get("/api/users").expect(200);
    expect(response.body.message).toBe("User route working ?");
  });

  it("GET /api/users/garages returns 401 without auth", async () => {
    await request(app).get("/api/users/garages").expect(401);
  });

  it("GET /api/users/garages returns data with auth", async () => {
    const response = await request(app)
      .get("/api/users/garages")
      .set("Authorization", `Bearer ${makeToken()}`)
      .expect(200);
    expect(response.body.route).toBe("listApprovedGarages");
  });

  const authedRoutes = [
    { method: "put", path: "/api/users/me", route: "updateMe" },
    { method: "put", path: "/api/users/me/avatar", route: "updateMyAvatar" },
    { method: "post", path: "/api/users/bikes", route: "createBike" },
    { method: "get", path: "/api/users/bikes", route: "listMyBikes" },
    { method: "put", path: "/api/users/bikes/bike-1", route: "updateBike" },
    { method: "post", path: "/api/users/appointments", route: "createAppointment" },
    { method: "get", path: "/api/users/appointments", route: "listMyAppointments" },
    { method: "get", path: "/api/users/appointments/availability", route: "getSlotAvailability" },
    { method: "patch", path: "/api/users/appointments/apt-1/cancel", route: "cancelAppointment" },
    { method: "get", path: "/api/users/rewards", route: "getMyRewards" },
    { method: "post", path: "/api/users/invoices/inv-1/pay", route: "payInvoice" },
    { method: "get", path: "/api/users/invoices/inv-1/print", route: "getInvoicePrintView" },
  ];

  test.each(authedRoutes)("route %s %s works with auth", async ({ method, path, route }) => {
    const response = await request(app)
      [method](path)
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({})
      .expect(200);
    expect(response.body.route).toBe(route);
  });
});
