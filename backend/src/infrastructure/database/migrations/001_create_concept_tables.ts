import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create concept table
  await db.schema
    .createTable("concept")
    .addColumn("id", "integer", (col) =>
      col.unsigned().autoIncrement().notNull().primaryKey()
    )
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .execute();

  // Add unique index on concept name
  await db.schema
    .createIndex("uk_concept_name")
    .on("concept")
    .column("name")
    .unique()
    .execute();

  // Create concept_group table (parent-child relationship between concepts)
  await db.schema
    .createTable("concept_group")
    .addColumn("parent_concept_id", "integer", (col) =>
      col.unsigned().notNull()
    )
    .addColumn("child_concept_id", "integer", (col) => col.unsigned().notNull())
    .addPrimaryKeyConstraint("concept_group_pkey", [
      "parent_concept_id",
      "child_concept_id",
    ])
    .execute();

  // Add index on child_concept_id for lookups
  await db.schema
    .createIndex("idx_concept_group_child")
    .on("concept_group")
    .column("child_concept_id")
    .execute();

  // Add foreign key constraints
  await sql`
    ALTER TABLE concept_group
    ADD CONSTRAINT fk_concept_group_parent
    FOREIGN KEY (parent_concept_id)
    REFERENCES concept(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE concept_group
    ADD CONSTRAINT fk_concept_group_child
    FOREIGN KEY (child_concept_id)
    REFERENCES concept(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `.execute(db);

  // Add trigger to prevent self-referencing (MariaDB doesn't support CHECK with column references in ALTER TABLE)
  await sql`
    CREATE TRIGGER trg_concept_group_not_self_insert
    BEFORE INSERT ON concept_group
    FOR EACH ROW
    BEGIN
      IF NEW.parent_concept_id = NEW.child_concept_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'parent_concept_id cannot equal child_concept_id';
      END IF;
    END
  `.execute(db);

  await sql`
    CREATE TRIGGER trg_concept_group_not_self_update
    BEFORE UPDATE ON concept_group
    FOR EACH ROW
    BEGIN
      IF NEW.parent_concept_id = NEW.child_concept_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'parent_concept_id cannot equal child_concept_id';
      END IF;
    END
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop tables in reverse order
  await db.schema.dropTable("concept_group").ifExists().execute();
  await db.schema.dropTable("concept").ifExists().execute();
}
