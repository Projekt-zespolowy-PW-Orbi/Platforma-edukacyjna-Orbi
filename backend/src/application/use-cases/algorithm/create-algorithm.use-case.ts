import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Algorithm, CreateAlgorithmDTO } from "domain/types.js";

export class CreateAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(data: CreateAlgorithmDTO): Promise<Algorithm> {
    return this.algorithmRepo.createAlgorithm(data);
  }
}
