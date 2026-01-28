import SequelizeMock from "sequelize-mock";

const dbMock = new SequelizeMock();

const GarageMock = dbMock.define("garage", {
  id: 1,
  name: "Motocare",
  address: "Kathmandu",
  phone: "9800000000",
  email: "info@motocare.test",
  photo_url: "https://example.test/garage.jpg",
  description: "Test garage description",
  services_offered: ["Oil Change"],
  opening_hours: { mon: "09:00-18:00" },
  location_coords: { lat: 27.7172, lng: 85.324 },
  status: "PENDING",
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("Garage Model", () => {
  it("should create a new Garage instance", async () => {
    const garageData = {
      name: "Motocare",
      address: "Kathmandu",
      phone: "9800000000",
      email: "info@motocare.test",
    };

    const garage = await GarageMock.create(garageData);

    expect(garage.get("name")).toBe(garageData.name);
    expect(garage.get("address")).toBe(garageData.address);
    expect(garage.get("phone")).toBe(garageData.phone);
    expect(garage.get("email")).toBe(garageData.email);
  });
});
