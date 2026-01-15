import sequelize from "./database/db.js";
import "./models/user/Users.js";

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected (Sequelize)");

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
})();
