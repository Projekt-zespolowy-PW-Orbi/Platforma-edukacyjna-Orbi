// ============================================
// Concept Entity Types
// ============================================
export interface Concept {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConceptDTO {
  name: string;
  description?: string;
}

export interface UpdateConceptDTO {
  name?: string;
  description?: string;
}

// ============================================
// Concept Group (Parent-Child Relationship)
// ============================================
export interface ConceptGroup {
  parentConceptId: number;
  childConceptId: number;
}

export interface CreateConceptGroupDTO {
  parentConceptId: number;
  childConceptId: number;
}

// ============================================
// Sentence Entity Types
// ============================================
export interface Sentence {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSentenceDTO {
  content: string;
}

export interface UpdateSentenceDTO {
  content?: string;
}

// ============================================
// Sentence Concept (Sentence-Concept Relationship)
// ============================================
export interface SentenceConcept {
  sentenceId: number;
  conceptId: number;
  isTrue: boolean;
}

export interface CreateSentenceConceptDTO {
  sentenceId: number;
  conceptId: number;
  isTrue: boolean;
}

// ============================================
// Algorithm Entity Types
// ============================================
export interface Algorithm {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAlgorithmDTO {
  name: string;
  description?: string;
}

export interface UpdateAlgorithmDTO {
  name?: string;
  description?: string;
}

// ============================================
// Step Entity Types
// ============================================
export interface Step {
  id: number;
  content: string;
  algorithmId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStepDTO {
  content: string;
  algorithmId?: number;
}

export interface UpdateStepDTO {
  content?: string;
  algorithmId?: number;
}

// ============================================
// Algorithm Step (Algorithm-Step Relationship)
// ============================================
export interface AlgorithmStep {
  id: number;
  algorithmId: number;
  stepId: number;
  orderNumber: number;
}

export interface CreateAlgorithmStepDTO {
  algorithmId: number;
  stepId: number;
  orderNumber: number;
}

// ============================================
// Pagination Types
// ============================================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
