import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { Sentence, UpdateSentenceDTO } from "domain/types.js";

export class UpdateSentenceUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(id: number, data: UpdateSentenceDTO): Promise<Sentence | null> {
    return this.sentenceRepo.update(id, data);
  }
}
