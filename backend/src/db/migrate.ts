import "dotenv/config";
import {
  initializeDatabase,
  closeConnection,
  db,
} from "infrastructure/database/connection.js";
import { runMigrations } from "infrastructure/database/migrate.js";

async function main(): Promise<void> {
  try {
    await initializeDatabase();
    await runMigrations(db);
    console.log("Migrations completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();
