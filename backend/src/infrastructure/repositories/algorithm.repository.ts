import type { Kysely } from "kysely";
import type { Database } from "infrastructure/database/types.js";
import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type {
  Algorithm,
  CreateAlgorithmDTO,
  UpdateAlgorithmDTO,
  Step,
  CreateStepDTO,
  UpdateStepDTO,
  AlgorithmStep,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export class AlgorithmRepository implements AlgorithmRepositoryPort {
  constructor(private readonly db: Kysely<Database>) {}

  // ============================================
  // Algorithm CRUD
  // ============================================

  async createAlgorithm(data: CreateAlgorithmDTO): Promise<Algorithm> {
    const now = new Date();
    const result = await this.db
      .insertInto("algorithm")
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

  async findAlgorithmById(id: number): Promise<Algorithm | null> {
    const result = await this.db
      .selectFrom("algorithm")
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

  async findAllAlgorithms(
    params?: PaginationParams
  ): Promise<PaginatedResult<Algorithm>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .selectFrom("algorithm")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    const total = countResult.count;

    // Get paginated data
    const results = await this.db
      .selectFrom("algorithm")
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const algorithms: Algorithm[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      description: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      data: algorithms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateAlgorithm(
    id: number,
    data: UpdateAlgorithmDTO
  ): Promise<Algorithm | null> {
    const existing = await this.findAlgorithmById(id);
    if (!existing) return null;

    await this.db
      .updateTable("algorithm")
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

  async deleteAlgorithm(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("algorithm")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  // ============================================
  // Step CRUD
  // ============================================

  async createStep(data: CreateStepDTO): Promise<Step> {
    const now = new Date();
    const result = await this.db
      .insertInto("step")
      .values({
        content: data.content,
        algorithm_id: data.algorithmId ?? null,
      })
      .executeTakeFirstOrThrow();

    const id = Number(result.insertId);
    return {
      id,
      content: data.content,
      algorithmId: data.algorithmId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findStepById(id: number): Promise<Step | null> {
    const result = await this.db
      .selectFrom("step")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) return null;

    return {
      id: result.id,
      content: result.content ?? "",
      algorithmId: result.algorithm_id ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findAllSteps(params?: PaginationParams): Promise<PaginatedResult<Step>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db
      .selectFrom("step")
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    const total = countResult.count;

    // Get paginated data
    const results = await this.db
      .selectFrom("step")
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const steps: Step[] = results.map((r) => ({
      id: r.id,
      content: r.content ?? "",
      algorithmId: r.algorithm_id ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return {
      data: steps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStep(id: number, data: UpdateStepDTO): Promise<Step | null> {
    const existing = await this.findStepById(id);
    if (!existing) return null;

    await this.db
      .updateTable("step")
      .set({
        content: data.content ?? existing.content,
        algorithm_id: data.algorithmId ?? null,
      })
      .where("id", "=", id)
      .execute();

    return {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
  }

  async deleteStep(id: number): Promise<boolean> {
    const result = await this.db
      .deleteFrom("step")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  // ============================================
  // Algorithm Step operations
  // ============================================

  async addStepToAlgorithm(
    algorithmId: number,
    stepId: number,
    orderNumber: number
  ): Promise<AlgorithmStep> {
    const result = await this.db
      .insertInto("algorithm_step")
      .values({
        algorithm_id: algorithmId,
        step_id: stepId,
        order_number: orderNumber,
      })
      .executeTakeFirstOrThrow();

    return {
      id: Number(result.insertId),
      algorithmId,
      stepId,
      orderNumber,
    };
  }

  async removeStepFromAlgorithm(
    algorithmId: number,
    stepId: number
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom("algorithm_step")
      .where("algorithm_id", "=", algorithmId)
      .where("step_id", "=", stepId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  async getStepsForAlgorithm(
    algorithmId: number
  ): Promise<(Step & { orderNumber: number })[]> {
    const results = await this.db
      .selectFrom("algorithm_step")
      .innerJoin("step", "step.id", "algorithm_step.step_id")
      .where("algorithm_step.algorithm_id", "=", algorithmId)
      .orderBy("algorithm_step.order_number", "asc")
      .selectAll("step")
      .select(["algorithm_step.order_number", "algorithm_step.id as algorithm_step_id"])
      .execute();

    return results.map((r) => ({
      id: r.id,
      content: r.content ?? "",
      algorithmId: r.algorithm_id ?? undefined,
      orderNumber: r.order_number,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}
