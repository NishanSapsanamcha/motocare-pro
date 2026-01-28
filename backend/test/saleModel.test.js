const SequelizeMock = require ("sequelize-mock");

const dbMock = new SequelizeMock();

const SaleMock = dbMock.define("sale", {
  id: 1,
  service_request_id: 101,
  amount: 1500.0,
  payment_method: "CASH",
  paid_at: new Date(),
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("Sale Model", () => {
  it("should create a new Sale instance", async () => {
    const saleData = {
      service_request_id: 101,
      amount: 1500.0,
      payment_method: "CASH",
    };

    const sale = await SaleMock.create(saleData);

    expect(sale.get("service_request_id")).toBe(saleData.service_request_id);
    expect(sale.get("amount")).toBe(saleData.amount);
    expect(sale.get("payment_method")).toBe(saleData.payment_method);
  });
});
