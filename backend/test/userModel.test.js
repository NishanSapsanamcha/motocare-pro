import SequelizeMock from "sequelize-mock";

const dbMock = new SequelizeMock();

const UserMock = dbMock.define("user", {
  id: "550e8400-e29b-41d4-a716-446655440000",
  full_name: "Test User",
  email: "test@example.com",
  phone_number: "9800000000",
  password: "hashed-password",
  role: "USER",
  password_reset_token: null,
  password_reset_expires: null,
  password_reset_used_at: null,
  is_blocked: false,
  is_deleted: false,
  created_at: new Date(),
  updated_at: new Date(),
});

describe("User Model", () => {
  it("should create a new User instance", async () => {
    const userData = {
      full_name: "Test User",
      email: "test@example.com",
      password: "hashed-password",
    };

    const user = await UserMock.create(userData);

    expect(user.get("full_name")).toBe(userData.full_name);
    expect(user.get("email")).toBe(userData.email);
    expect(user.get("password")).toBe(userData.password);
  });
});
