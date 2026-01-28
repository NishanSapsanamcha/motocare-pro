const SequelizeMock = require ("sequelize-mock");

const dbMock = new SequelizeMock();

const AppointmentMock = dbMock.define("appointment", {
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "user-123",
  bike_id: "bike-123",
  garage_id: 1,
  km_running: 1200,
  service_type: "General Service",
  preferred_date: new Date(),
  time_slot: "10:00-11:00",
  notes: "Test appointment notes",
  quoted_price: 1500,
  status: "REQUESTED",
  status_history: [],
  decided_by: null,
  decided_at: null,
  cancellation_reason: null,
  reschedule_from: null,
  reschedule_to: null,
  updated_by: null,
  internal_notes: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("Appointment Model", () => {
  it("should create a new Appointment instance", async () => {
    const appointmentData = {
      user_id: "user-123",
      bike_id: "bike-123",
      garage_id: 1,
      km_running: 1200,
      preferred_date: new Date(),
      time_slot: "10:00-11:00",
    };

    const appointment = await AppointmentMock.create(appointmentData);

    expect(appointment.get("user_id")).toBe(appointmentData.user_id);
    expect(appointment.get("bike_id")).toBe(appointmentData.bike_id);
    expect(appointment.get("garage_id")).toBe(appointmentData.garage_id);
    expect(appointment.get("km_running")).toBe(appointmentData.km_running);
  });
});
