import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Algorithm, UpdateAlgorithmDTO } from "domain/types.js";

export class UpdateAlgorithmUseCase {
  constructor(private readonly algorithmRepo: AlgorithmRepositoryPort) {}

  async execute(id: number, data: UpdateAlgorithmDTO): Promise<Algorithm | null> {
    return this.algorithmRepo.updateAlgorithm(id, data);
  }
}
