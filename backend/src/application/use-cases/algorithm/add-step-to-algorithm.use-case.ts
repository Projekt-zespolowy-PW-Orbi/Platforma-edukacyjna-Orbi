import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { AlgorithmStep } from "domain/types.js";

export class AddStepToAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(algorithmId: number, stepId: number, orderNumber: number): Promise<AlgorithmStep> {
    return this.algorithmRepo.addStepToAlgorithm(algorithmId, stepId, orderNumber);
  }
}
