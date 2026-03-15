import { Kysely, MysqlDialect, type MysqlPool, sql } from "kysely";
import { createPool, type Pool } from "mysql2";
import type { Database } from "infrastructure/database/types.js";
import { runMigrations } from "infrastructure/database/migrate.js";

let pool: Pool;
let testDb: Kysely<Database>;

/**
 * Creates a fresh Kysely instance connected to the test database.
 * Uses DB_NAME env var if set, otherwise defaults to "orbi_test".
 * Runs migrations if tables don't exist yet.
 */
export async function setupTestDb(): Promise<Kysely<Database>> {
  pool = createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER ?? "orbi",
    password: process.env.DB_PASSWORD ?? "orbi_secret",
    database: process.env.DB_NAME ?? "orbi_test",
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 10000,
  });

  testDb = new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: pool as unknown as MysqlPool,
    }),
  });

  // Ensure migrations are applied
  await runMigrations(testDb);

  return testDb;
}

/**
 * Clears all data from tables (preserving schema).
 */
export async function cleanTables(): Promise<void> {
  // Delete in order respecting foreign keys
  await sql`DELETE FROM algorithm_step`.execute(testDb);
  await sql`DELETE FROM step`.execute(testDb);
  await sql`DELETE FROM algorithm`.execute(testDb);
  await sql`DELETE FROM sentence_concept`.execute(testDb);
  await sql`DELETE FROM sentence`.execute(testDb);
  await sql`DELETE FROM concept_group`.execute(testDb);
  await sql`DELETE FROM concept`.execute(testDb);
}

/**
 * Destroys the database connection pool.
 */
export async function teardownTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
  }
}

export function getTestDb(): Kysely<Database> {
  return testDb;
}
