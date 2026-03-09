import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { Concept, CreateConceptDTO } from "domain/types.js";

export class CreateConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(data: CreateConceptDTO): Promise<Concept> {
    return this.conceptRepo.create(data);
  }
}
