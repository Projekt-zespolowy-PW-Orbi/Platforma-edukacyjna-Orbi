import type { Kysely } from "kysely";
import type { Database } from "infrastructure/database/types.js";
import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type {
  Sentence,
  CreateSentenceDTO,
  UpdateSentenceDTO,
  SentenceConcept,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export class SentenceRepository implements SentenceRepositoryPort {
  constructor(private readonly db: Kysely<Database>) {}

  // ============================================
  // Sentence CRUD
  // ============================================

  async create(data: CreateSentenceDTO): Promise<Sentence> {
    const now = new Date();
    const result = await this.db
      .insertInto("sentence")
      .values({
        content: data.content,
      })
      .executeTakeFirstOrThrow();

    const id = Number(result.insertId);
    return {
      id,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: number): Promise<Sentence | null> {
    const result = await this.db
      .selectFrom("sentence")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) return null;

    return {
      id: result.id,
      content: result.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Sentence>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .selectFrom("sentence")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    const total = countResult.count;

    // Get paginated data
    const results = await this.db
      .selectFrom("sentence")
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const sentences: Sentence[] = results.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      data: sentences,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: number, data: UpdateSentenceDTO): Promise<Sentence | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    await this.db
      .updateTable("sentence")
      .set({
        content: data.content ?? existing.content,
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
      .deleteFrom("sentence")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  // ============================================
  // Sentence Concept operations
  // ============================================

  async linkConcept(
    sentenceId: number,
    conceptId: number,
    isTrue: boolean
  ): Promise<SentenceConcept> {
    await this.db
      .insertInto("sentence_concept")
      .values({
        sentence_id: sentenceId,
        concept_id: conceptId,
        is_true: isTrue,
      })
      .execute();

    return {
      sentenceId,
      conceptId,
      isTrue,
    };
  }

  async unlinkConcept(sentenceId: number, conceptId: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("sentence_concept")
      .where("sentence_id", "=", sentenceId)
      .where("concept_id", "=", conceptId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async getConceptsForSentence(sentenceId: number): Promise<SentenceConcept[]> {
    const results = await this.db
      .selectFrom("sentence_concept")
      .where("sentence_id", "=", sentenceId)
      .selectAll()
      .execute();

    return results.map((r) => ({
      sentenceId: r.sentence_id,
      conceptId: r.concept_id,
      isTrue: r.is_true,
    }));
  }

  async getSentencesForConcept(conceptId: number): Promise<SentenceConcept[]> {
    const results = await this.db
      .selectFrom("sentence_concept")
      .where("concept_id", "=", conceptId)
      .selectAll()
      .execute();

    return results.map((r) => ({
      sentenceId: r.sentence_id,
      conceptId: r.concept_id,
      isTrue: r.is_true,
    }));
  }
}
