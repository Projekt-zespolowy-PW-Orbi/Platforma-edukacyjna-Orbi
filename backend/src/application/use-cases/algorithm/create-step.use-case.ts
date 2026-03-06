import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Step, CreateStepDTO } from "domain/types.js";

export class CreateStepUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(data: CreateStepDTO): Promise<Step> {
    return this.algorithmRepo.createStep(data);
  }
}
