import "dotenv/config";
import { sql } from "kysely";
import {
  initializeDatabase,
  closeConnection,
  db,
} from "infrastructure/database/connection.js";
import { runMigrations } from "infrastructure/database/migrate.js";

/**
 * Drops all application tables and the migrations tracking table.
 */
async function dropAllTables(): Promise<void> {
  console.log("Dropping all tables...");

  await sql`SET FOREIGN_KEY_CHECKS = 0`.execute(db);

  const tables = [
    "algorithm_step",
    "step",
    "algorithm",
    "sentence_concept",
    "sentence",
    "concept_group",
    "concept",
    "migrations",
  ];

  for (const table of tables) {
    await sql.raw(`DROP TABLE IF EXISTS \`${table}\``).execute(db);
  }

  await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(db);
  console.log("All tables dropped.");
}

async function main(): Promise<void> {
  try {
    console.log("=== DB Reset ===\n");
    await initializeDatabase();
    await dropAllTables();
    await runMigrations(db);
    console.log("\nDB reset completed successfully!");
  } catch (error) {
    console.error("DB reset failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();
