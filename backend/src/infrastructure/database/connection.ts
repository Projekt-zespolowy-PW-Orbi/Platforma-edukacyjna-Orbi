import { Kysely, MysqlDialect, type MysqlPool, sql } from "kysely";
import { createPool, type Pool } from "mysql2";
import type { Database } from "./types.js";

/**
 * Database configuration from environment variables
 */
const dbConfig = {
  host: process.env.DB_HOST ?? "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER ?? "orbi",
  password: process.env.DB_PASSWORD ?? "orbi_secret",
  database: process.env.DB_NAME ?? "orbi_dev",
};

const pool: Pool = createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

/**
 * Kysely database instance with MySQL/MariaDB dialect.
 * Uses connection pooling via mysql2.
 */
export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: pool as unknown as MysqlPool,
  }),
});

/**
 * Tests the database connection by executing a simple query.
 * @returns true if connection is successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`.execute(db);
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

/**
 * Closes the database connection pool gracefully.
 */
export async function closeConnection(): Promise<void> {
  await db.destroy();
  console.log("Database connection closed");
}

/**
 * Initializes the database connection and logs the status.
 * Should be called during application startup.
 */
export async function initializeDatabase(): Promise<void> {
  const isConnected = await testConnection();
  if (isConnected) {
    console.log(
      `Database connected successfully to ${dbConfig.host}:${String(dbConfig.port)}/${dbConfig.database}`
    );
  } else {
    console.error("Failed to connect to database");
    throw new Error("Database connection failed");
  }
}
