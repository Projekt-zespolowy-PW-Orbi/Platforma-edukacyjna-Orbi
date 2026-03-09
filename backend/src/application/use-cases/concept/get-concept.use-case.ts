import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { Concept } from "domain/types.js";

export class GetConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(id: number): Promise<Concept | null> {
    return this.conceptRepo.findById(id);
  }
}
