import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";

export class RemoveStepFromAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(algorithmId: number, stepId: number): Promise<boolean> {
    return this.algorithmRepo.removeStepFromAlgorithm(algorithmId, stepId);
  }
}
