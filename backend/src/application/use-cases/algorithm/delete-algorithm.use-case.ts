import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";

export class DeleteAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(id: number): Promise<boolean> {
    return this.algorithmRepo.deleteAlgorithm(id);
  }
}
