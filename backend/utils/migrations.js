import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "../migrations");
const tableName = "migrations";

export const runMigrations = async (sequelize) => {
  const qi = sequelize.getQueryInterface();
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS ${tableName} (
      name VARCHAR(255) PRIMARY KEY,
      run_on TIMESTAMP NOT NULL DEFAULT NOW()
    );`
  );

  let files = [];
  try {
    files = await fs.readdir(migrationsDir);
  } catch {
    return;
  }

  const migrationFiles = files
    .filter((f) => f.endsWith(".js"))
    .sort();

  const [rows] = await sequelize.query(`SELECT name FROM ${tableName};`);
  const applied = new Set(rows.map((r) => r.name));

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;
    const mod = await import(pathToFileURL(path.join(migrationsDir, file)).href);
    if (typeof mod.up !== "function") {
      throw new Error(`Migration ${file} is missing an up() function`);
    }
    await mod.up({ sequelize, queryInterface: qi });
    await sequelize.query(`INSERT INTO ${tableName} (name) VALUES (:name);`, {
      replacements: { name: file },
    });
  }
};
