import type {
  Sentence,
  CreateSentenceDTO,
  UpdateSentenceDTO,
  SentenceConcept,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export interface SentenceRepositoryPort {
  // Sentence CRUD
  create(data: CreateSentenceDTO): Promise<Sentence>;
  findById(id: number): Promise<Sentence | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<Sentence>>;
  update(id: number, data: UpdateSentenceDTO): Promise<Sentence | null>;
  delete(id: number): Promise<boolean>;

  // Sentence Concept operations
  linkConcept(sentenceId: number, conceptId: number, isTrue: boolean): Promise<SentenceConcept>;
  unlinkConcept(sentenceId: number, conceptId: number): Promise<boolean>;
  getConceptsForSentence(sentenceId: number): Promise<SentenceConcept[]>;
  getSentencesForConcept(conceptId: number): Promise<SentenceConcept[]>;
}
