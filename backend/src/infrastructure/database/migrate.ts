import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database } from "./types.js";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { readdirSync } from "fs";

/**
 * Migration file interface
 */
interface Migration {
  name: string;
  up: (db: Kysely<unknown>) => Promise<void>;
  down: (db: Kysely<unknown>) => Promise<void>;
}

/**
 * Creates the migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("migrations")
    .ifNotExists()
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("executed_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();
}

/**
 * Gets the list of already executed migrations
 */
async function getExecutedMigrations(db: Kysely<Database>): Promise<string[]> {
  const result = await db
    .selectFrom("migrations")
    .select("name")
    .orderBy("name")
    .execute();

  return result.map((row) => row.name);
}

/**
 * Loads migration files from the migrations directory
 * Returns migrations sorted by name (001, 002, 003...)
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");
  
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
    .sort();

  const migrations: Migration[] = [];

  for (const file of files) {
    const migrationPath = join(migrationsDir, file);
    const module = (await import(pathToFileURL(migrationPath).href)) as {
      up?: (db: Kysely<unknown>) => Promise<void>;
      down?: (db: Kysely<unknown>) => Promise<void>;
    };

    if (typeof module.up === "function" && typeof module.down === "function") {
      migrations.push({
        name: file,
        up: module.up,
        down: module.down,
      });
    }
  }

  return migrations;
}

/**
 * Runs all pending migrations in order
 * @param db - Kysely database instance
 * @returns Array of executed migration names
 */
export async function runMigrations(db: Kysely<Database>): Promise<string[]> {
  console.log("Running database migrations...");

  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get executed and available migrations
  const executed = await getExecutedMigrations(db);
  const migrations = await loadMigrations();

  // Filter to only pending migrations
  const pending = migrations.filter((m) => !executed.includes(m.name));

  if (pending.length === 0) {
    console.log("No pending migrations");
    return [];
  }

  console.log(`Found ${String(pending.length)} pending migration(s)`);

  const executedMigrations: string[] = [];

  // Run each migration in a transaction
  for (const migration of pending) {
    console.log(`Running migration: ${migration.name}`);
    
    await db.transaction().execute(async (trx) => {
      // Run the migration - cast through unknown to avoid type issues
      await migration.up(trx as unknown as Kysely<unknown>);

      // Record the migration - use sql raw for executed_at default
      await trx
        .insertInto("migrations")
        .values({ 
          name: migration.name,
          executed_at: sql`CURRENT_TIMESTAMP`
        })
        .execute();
    });

    executedMigrations.push(migration.name);
    console.log(`Completed migration: ${migration.name}`);
  }

  console.log("All migrations completed successfully");
  return executedMigrations;
}

/**
 * Rolls back the last N migrations
 * @param db - Kysely database instance
 * @param steps - Number of migrations to roll back (default: 1)
 * @returns Array of rolled back migration names
 */
export async function rollbackMigrations(
  db: Kysely<Database>,
  steps = 1
): Promise<string[]> {
  console.log(`Rolling back ${String(steps)} migration(s)...`);

  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get executed migrations in reverse order
  const executed = (await getExecutedMigrations(db)).reverse();
  const migrations = await loadMigrations();

  const toRollback = executed.slice(0, steps);
  const rolledBack: string[] = [];

  for (const migrationName of toRollback) {
    const migration = migrations.find((m) => m.name === migrationName);
    
    if (!migration) {
      console.warn(`Migration file not found: ${migrationName}`);
      continue;
    }

    console.log(`Rolling back: ${migration.name}`);

    await db.transaction().execute(async (trx) => {
      // Run the down migration - cast through unknown to avoid type issues
      await migration.down(trx as unknown as Kysely<unknown>);

      // Remove the migration record
      await trx
        .deleteFrom("migrations")
        .where("name", "=", migration.name)
        .execute();
    });

    rolledBack.push(migration.name);
    console.log(`Rolled back: ${migration.name}`);
  }

  console.log("Rollback completed");
  return rolledBack;
}

/**
 * Gets the status of all migrations
 * @param db - Kysely database instance
 * @returns Object with pending and executed migration lists
 */
export async function getMigrationStatus(
  db: Kysely<Database>
): Promise<{ pending: string[]; executed: string[] }> {
  await ensureMigrationsTable(db);

  const executed = await getExecutedMigrations(db);
  const migrations = await loadMigrations();

  const pending = migrations
    .filter((m) => !executed.includes(m.name))
    .map((m) => m.name);

  return { pending, executed };
}
