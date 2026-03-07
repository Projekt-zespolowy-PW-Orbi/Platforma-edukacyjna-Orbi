import type {
  Concept,
  CreateConceptDTO,
  UpdateConceptDTO,
  ConceptGroup,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export interface ConceptRepositoryPort {
  // Concept CRUD
  create(data: CreateConceptDTO): Promise<Concept>;
  findById(id: number): Promise<Concept | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<Concept>>;
  update(id: number, data: UpdateConceptDTO): Promise<Concept | null>;
  delete(id: number): Promise<boolean>;

  // Concept Group operations
  addChild(parentId: number, childId: number): Promise<ConceptGroup>;
  removeChild(parentId: number, childId: number): Promise<boolean>;
  getChildren(parentId: number): Promise<Concept[]>;
  getParents(childId: number): Promise<Concept[]>;
}
