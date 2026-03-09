import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create algorithm table
  await db.schema
    .createTable("algorithm")
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .execute();

  // Add unique index on algorithm name
  await db.schema
    .createIndex("uk_algorithm_name")
    .on("algorithm")
    .column("name")
    .unique()
    .execute();

  // Create step table (shared steps between algorithms)
  await db.schema
    .createTable("step")
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("content", "text", (col) => col)
    .addColumn("algorithm_id", "integer", (col) => col.unsigned())
    .execute();

  // Add foreign key constraint for step -> algorithm
  await sql`
    ALTER TABLE step
    ADD CONSTRAINT fk_algorithm_step_referenced_algorithm
    FOREIGN KEY (algorithm_id)
    REFERENCES algorithm(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
  `.execute(db);

  // Create algorithm_step table (ordering of steps in algorithms)
  await db.schema
    .createTable("algorithm_step")
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("algorithm_id", "integer", (col) => col.unsigned().notNull())
    .addColumn("step_id", "integer", (col) => col.unsigned().notNull())
    .addColumn("order_number", "integer", (col) => col.unsigned().notNull())
    .execute();

  // Add unique index on algorithm_id + order_number
  await db.schema
    .createIndex("uk_algorithm_step_order")
    .on("algorithm_step")
    .columns(["algorithm_id", "order_number"])
    .unique()
    .execute();

  // Add index on step_id for lookups
  await db.schema
    .createIndex("idx_algorithm_step_step")
    .on("algorithm_step")
    .column("step_id")
    .execute();

  // Add foreign key constraints
  await sql`
    ALTER TABLE algorithm_step
    ADD CONSTRAINT fk_algorithm_step_algorithm
    FOREIGN KEY (algorithm_id)
    REFERENCES algorithm(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE algorithm_step
    ADD CONSTRAINT fk_algorithm_step_step
    FOREIGN KEY (step_id)
    REFERENCES step(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable("algorithm_step").ifExists().execute();
  await db.schema.dropTable("step").ifExists().execute();
  await db.schema.dropTable("algorithm").ifExists().execute();
}
