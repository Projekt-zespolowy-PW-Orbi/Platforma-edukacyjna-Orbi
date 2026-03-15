import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { PaginatedResult, PaginationParams } from "domain/types.js";

export class ListSentencesUseCase {
  constructor(private readonly sentenceRepo: SentenceRepositoryPort) {}

  async execute(params?: PaginationParams): Promise<PaginatedResult<{ id: number; content: string }>> {
    return this.sentenceRepo.findAll(params);
  }
}
