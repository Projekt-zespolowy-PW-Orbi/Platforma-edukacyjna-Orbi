import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Step } from "domain/types.js";

export class GetAlgorithmStepsUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(algorithmId: number): Promise<(Step & { orderNumber: number })[]> {
    return this.algorithmRepo.getStepsForAlgorithm(algorithmId);
  }
}
