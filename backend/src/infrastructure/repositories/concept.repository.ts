import type { Kysely } from "kysely";
import type { Database } from "infrastructure/database/types.js";
import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type {
  Concept,
  CreateConceptDTO,
  UpdateConceptDTO,
  ConceptGroup,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export class ConceptRepository implements ConceptRepositoryPort {
  constructor(private readonly db: Kysely<Database>) {}

  // ============================================
  // Concept CRUD
  // ============================================

  async create(data: CreateConceptDTO): Promise<Concept> {
    const now = new Date();
    const result = await this.db
      .insertInto("concept")
      .values({
        name: data.name,
      })
      .executeTakeFirstOrThrow();

    const id = Number(result.insertId);
    return {
      id,
      name: data.name,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: number): Promise<Concept | null> {
    const result = await this.db
      .selectFrom("concept")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      description: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Concept>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .selectFrom("concept")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    const total = countResult.count;

    // Get paginated data
    const results = await this.db
      .selectFrom("concept")
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const concepts: Concept[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      description: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      data: concepts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: number, data: UpdateConceptDTO): Promise<Concept | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db
      .updateTable("concept")
      .set({
        name: data.name ?? existing.name,
      })
      .where("id", "=", id)
      .execute();

    return {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("concept")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  // ============================================
  // Concept Group operations
  // ============================================

  async addChild(parentId: number, childId: number): Promise<ConceptGroup> {
    await this.db
      .insertInto("concept_group")
      .values({
        parent_concept_id: parentId,
        child_concept_id: childId,
      })
      .execute();

    return {
      parentConceptId: parentId,
      childConceptId: childId,
    };
  }

  async removeChild(parentId: number, childId: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("concept_group")
      .where("parent_concept_id", "=", parentId)
      .where("child_concept_id", "=", childId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async getChildren(parentId: number): Promise<Concept[]> {
    const results = await this.db
      .selectFrom("concept_group")
      .innerJoin("concept", "concept.id", "concept_group.child_concept_id")
      .where("concept_group.parent_concept_id", "=", parentId)
      .selectAll("concept")
      .execute();

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      description: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async getParents(childId: number): Promise<Concept[]> {
    const results = await this.db
      .selectFrom("concept_group")
      .innerJoin("concept", "concept.id", "concept_group.parent_concept_id")
      .where("concept_group.child_concept_id", "=", childId)
      .selectAll("concept")
      .execute();

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      description: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}
