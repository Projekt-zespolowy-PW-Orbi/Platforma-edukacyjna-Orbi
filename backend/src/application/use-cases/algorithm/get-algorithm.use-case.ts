import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Algorithm } from "domain/types.js";

export class GetAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(id: number): Promise<Algorithm | null> {
    return this.algorithmRepo.findAlgorithmById(id);
  }
}
