import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";

export class RemoveChildConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(parentId: number, childId: number): Promise<boolean> {
    return this.conceptRepo.removeChild(parentId, childId);
  }
}
