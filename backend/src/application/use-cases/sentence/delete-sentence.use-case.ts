import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";

export class DeleteSentenceUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(id: number): Promise<boolean> {
    return this.sentenceRepo.delete(id);
  }
}
