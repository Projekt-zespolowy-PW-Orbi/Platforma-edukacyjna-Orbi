import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { ConceptGroup } from "domain/types.js";

export class AddChildConceptUseCase {
  constructor(private readonly conceptRepo: ConceptRepositoryPort) {}

  async execute(parentId: number, childId: number): Promise<ConceptGroup> {
    return this.conceptRepo.addChild(parentId, childId);
  }
}
