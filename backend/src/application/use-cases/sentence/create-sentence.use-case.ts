import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { Sentence, CreateSentenceDTO } from "domain/types.js";

export class CreateSentenceUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(data: CreateSentenceDTO): Promise<Sentence> {
    return this.sentenceRepo.create(data);
  }
}
