import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { Concept, UpdateConceptDTO } from "domain/types.js";

export class UpdateConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(id: number, data: UpdateConceptDTO): Promise<Concept | null> {
    return this.conceptRepo.update(id, data);
  }
}
