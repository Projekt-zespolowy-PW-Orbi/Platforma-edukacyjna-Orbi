import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";

export class UnlinkSentenceConceptUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(sentenceId: number, conceptId: number): Promise<boolean> {
    return this.sentenceRepo.unlinkConcept(sentenceId, conceptId);
  }
}
