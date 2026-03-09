import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create sentence table
  await db.schema
    .createTable("sentence")
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("content", "text", (col) => col.notNull())
    .execute();

  // Create sentence_concept table (links sentences to concepts)
  await db.schema
    .createTable("sentence_concept")
    .addColumn("sentence_id", "integer", (col) => col.unsigned().notNull())
    .addColumn("concept_id", "integer", (col) => col.unsigned().notNull())
    .addColumn("is_true", "boolean", (col) => col.notNull().defaultTo(true))
    .addPrimaryKeyConstraint("sentence_concept_pkey", [
      "sentence_id",
      "concept_id",
    ])
    .execute();

  // Add index on concept_id for lookups
  await db.schema
    .createIndex("idx_sentence_concept_concept")
    .on("sentence_concept")
    .column("concept_id")
    .execute();

  // Add foreign key constraints
  await sql`
    ALTER TABLE sentence_concept
    ADD CONSTRAINT fk_sentence_concept_sentence
    FOREIGN KEY (sentence_id)
    REFERENCES sentence(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE sentence_concept
    ADD CONSTRAINT fk_sentence_concept_concept
    FOREIGN KEY (concept_id)
    REFERENCES concept(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable("sentence_concept").ifExists().execute();
  await db.schema.dropTable("sentence").ifExists().execute();
}
