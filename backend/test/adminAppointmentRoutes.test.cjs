const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

let app;
let adminAppointmentRoutes;
let Appointment;
let Invoice;
let InvoiceItem;

const makeToken = (role = "ADMIN") =>
  jwt.sign({ id: "user-123", role }, process.env.JWT_SECRET);

beforeAll(async () => {
  ({ default: adminAppointmentRoutes } = await import("../route/admin/appointmentRoutes.js"));
  ({ default: Appointment } = await import("../models/appointment/Appointment.js"));
  ({ default: Invoice } = await import("../models/Invoice.js"));
  ({ default: InvoiceItem } = await import("../models/InvoiceItem.js"));

  app = express();
  app.use(express.json());
  app.use("/api/admin/appointments", adminAppointmentRoutes);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Admin appointment routes", () => {
  it("GET /api/admin/appointments returns 401 without auth", async () => {
    await request(app)
      .get("/api/admin/appointments")
      .expect(401);
  });

  it("GET /api/admin/appointments returns appointments list", async () => {
    const findSpy = jest
      .spyOn(Appointment, "findAndCountAll")
      .mockResolvedValue({ count: 1, rows: [{ id: "apt-1" }] });

    const response = await request(app)
      .get("/api/admin/appointments?page=1&limit=10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .expect(200);

    expect(response.body.message).toBe("Appointments fetched");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data[0].id).toBe("apt-1");
    expect(findSpy).toHaveBeenCalled();
  });

  it("GET /api/admin/appointments/slot-occupancy returns counts", async () => {
    jest.spyOn(Appointment, "findAll").mockResolvedValue([
      {
        time_slot: "10:00-11:00",
        get: (key) => (key === "count" ? "2" : undefined),
      },
      {
        time_slot: "11:00-12:00",
        get: (key) => (key === "count" ? 1 : undefined),
      },
    ]);

    const response = await request(app)
      .get("/api/admin/appointments/slot-occupancy?date=2026-01-10")
      .set("Authorization", `Bearer ${makeToken()}`)
      .expect(200);

    expect(response.body.message).toBe("Slot occupancy fetched");
    expect(response.body.data.counts["10:00-11:00"]).toBe(2);
    expect(response.body.data.counts["11:00-12:00"]).toBe(1);
  });

  it("PATCH /api/admin/appointments/:id/price updates quoted price", async () => {
    const appointment = {
      id: "apt-1",
      quoted_price: null,
      updated_at: null,
      updated_by: null,
      invoice: {
        id: "inv-1",
        status: "DRAFT",
        save: jest.fn(),
      },
      save: jest.fn(),
    };

    jest.spyOn(Appointment, "findByPk").mockResolvedValue(appointment);
    jest.spyOn(InvoiceItem, "count").mockResolvedValue(0);

    const response = await request(app)
      .patch("/api/admin/appointments/apt-1/price")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ quoted_price: 1234 })
      .expect(200);

    expect(response.body.message).toBe("Appointment price updated");
    expect(appointment.quoted_price).toBe(1234);
    expect(appointment.save).toHaveBeenCalled();
    expect(appointment.invoice.save).toHaveBeenCalled();
  });

  it("POST /api/admin/appointments/:id/invoice creates invoice", async () => {
    const appointment = { id: "apt-2", quoted_price: 500 };
    const createdInvoice = { id: "inv-2", status: "DRAFT" };

    jest.spyOn(Appointment, "findByPk").mockResolvedValue(appointment);
    jest.spyOn(Invoice, "findOne").mockResolvedValue(null);
    jest.spyOn(Invoice, "create").mockResolvedValue(createdInvoice);
    jest.spyOn(InvoiceItem, "bulkCreate").mockResolvedValue([]);

    const response = await request(app)
      .post("/api/admin/appointments/apt-2/invoice")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({
        status: "DRAFT",
        vat_rate: 13,
        items: [{ description: "Service", unit_price: 500, quantity: 1 }],
      })
      .expect(201);

    expect(response.body.message).toBe("Invoice created");
    expect(response.body.data.id).toBe("inv-2");
  });
});
