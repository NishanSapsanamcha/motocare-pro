const SequelizeMock = require ("sequelize-mock");

const dbMock = new SequelizeMock();

const BikeMock = dbMock.define("bike", {
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "user-123",
  company: "Yamaha",
  model: "FZ",
  registration_no: "BA-99-PA-1234",
  color: "Blue",
  use_new_number: false,
  state: "Bagmati",
  new_registration_no: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("Bike Model", () => {
  it("should create a new Bike instance", async () => {
    const bikeData = {
      user_id: "user-123",
      company: "Yamaha",
      model: "FZ",
      registration_no: "BA-99-PA-1234",
      color: "Blue",
    };

    const bike = await BikeMock.create(bikeData);

    expect(bike.get("user_id")).toBe(bikeData.user_id);
    expect(bike.get("company")).toBe(bikeData.company);
    expect(bike.get("model")).toBe(bikeData.model);
    expect(bike.get("registration_no")).toBe(bikeData.registration_no);
    expect(bike.get("color")).toBe(bikeData.color);
  });
});
