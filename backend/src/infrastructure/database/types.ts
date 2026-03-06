import type { Generated } from "kysely";

/**
 * Database type definitions for Kysely.
 * These types correspond to the tables created in migrations.
 */

// Concept system tables
export interface ConceptTable {
  id: Generated<number>;
  name: string;
}

export interface ConceptGroupTable {
  parent_concept_id: number;
  child_concept_id: number;
}

// Sentence system tables
export interface SentenceTable {
  id: Generated<number>;
  content: string;
}

export interface SentenceConceptTable {
  sentence_id: number;
  concept_id: number;
  is_true: boolean;
}

// Algorithm system tables
export interface AlgorithmTable {
  id: Generated<number>;
  name: string;
}

export interface StepTable {
  id: Generated<number>;
  content: string | null;
  algorithm_id: number | null;
}

export interface AlgorithmStepTable {
  id: Generated<number>;
  algorithm_id: number;
  step_id: number;
  order_number: number;
}

// Migration tracking table
export interface MigrationsTable {
  id: Generated<number>;
  name: string;
  executed_at: Date;
}

/**
 * Main database interface for Kysely.
 * Add new tables here as migrations are created.
 */
export interface Database {
  concept: ConceptTable;
  concept_group: ConceptGroupTable;
  sentence: SentenceTable;
  sentence_concept: SentenceConceptTable;
  algorithm: AlgorithmTable;
  step: StepTable;
  algorithm_step: AlgorithmStepTable;
  migrations: MigrationsTable;
}
