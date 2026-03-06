import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";

export class DeleteConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(id: number): Promise<boolean> {
    return this.conceptRepo.delete(id);
  }
}
