import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { PaginatedResult, PaginationParams } from "domain/types.js";

export class ListConceptsUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(params?: PaginationParams): Promise<PaginatedResult<{ id: number; name: string; description?: string }>> {
    return this.conceptRepo.findAll(params);
  }
}
