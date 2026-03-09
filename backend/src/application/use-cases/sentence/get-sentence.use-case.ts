import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { Sentence } from "domain/types.js";

export class GetSentenceUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(id: number): Promise<Sentence | null> {
    return this.sentenceRepo.findById(id);
  }
}
