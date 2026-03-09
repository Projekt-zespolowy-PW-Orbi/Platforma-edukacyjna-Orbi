import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { PaginatedResult, PaginationParams } from "domain/types.js";

export class ListAlgorithmsUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(params?: PaginationParams): Promise<PaginatedResult<{ id: number; name: string; description?: string }>> {
    return this.algorithmRepo.findAllAlgorithms(params);
  }
}
