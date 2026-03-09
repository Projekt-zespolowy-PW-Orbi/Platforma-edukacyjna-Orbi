import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { SentenceConcept } from "domain/types.js";

export class LinkSentenceConceptUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(sentenceId: number, conceptId: number, isTrue: boolean): Promise<SentenceConcept> {
    return this.sentenceRepo.linkConcept(sentenceId, conceptId, isTrue);
  }
}
