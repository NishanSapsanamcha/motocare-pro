import SequelizeMock from "sequelize-mock";

const dbMock = new SequelizeMock();

const ServiceRequestMock = dbMock.define("service_request", {
  id: 1,
  user_id: "user-123",
  garage_id: 10,
  vehicle_info: { make: "Yamaha", model: "FZ" },
  service_type: "General Service",
  description: "Test service request",
  status: "PENDING",
  requested_date: new Date(),
  completed_date: null,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("ServiceRequest Model", () => {
  it("should create a new ServiceRequest instance", async () => {
    const requestData = {
      user_id: "user-123",
      garage_id: 10,
      vehicle_info: { make: "Yamaha", model: "FZ" },
      service_type: "General Service",
      requested_date: new Date(),
    };

    const request = await ServiceRequestMock.create(requestData);

    expect(request.get("user_id")).toBe(requestData.user_id);
    expect(request.get("garage_id")).toBe(requestData.garage_id);
    expect(request.get("service_type")).toBe(requestData.service_type);
  });
});
