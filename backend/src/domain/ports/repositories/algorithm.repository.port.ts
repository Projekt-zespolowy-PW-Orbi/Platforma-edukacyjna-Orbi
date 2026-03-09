import type {
  Algorithm,
  CreateAlgorithmDTO,
  UpdateAlgorithmDTO,
  Step,
  CreateStepDTO,
  UpdateStepDTO,
  AlgorithmStep,
  PaginatedResult,
  PaginationParams,
} from "domain/types.js";

export interface AlgorithmRepositoryPort {
  // Algorithm CRUD
  createAlgorithm(data: CreateAlgorithmDTO): Promise<Algorithm>;
  findAlgorithmById(id: number): Promise<Algorithm | null>;
  findAllAlgorithms(params?: PaginationParams): Promise<PaginatedResult<Algorithm>>;
  updateAlgorithm(id: number, data: UpdateAlgorithmDTO): Promise<Algorithm | null>;
  deleteAlgorithm(id: number): Promise<boolean>;

  // Step CRUD
  createStep(data: CreateStepDTO): Promise<Step>;
  findStepById(id: number): Promise<Step | null>;
  findAllSteps(params?: PaginationParams): Promise<PaginatedResult<Step>>;
  updateStep(id: number, data: UpdateStepDTO): Promise<Step | null>;
  deleteStep(id: number): Promise<boolean>;

  // Algorithm Step operations
  addStepToAlgorithm(algorithmId: number, stepId: number, orderNumber: number): Promise<AlgorithmStep>;
  removeStepFromAlgorithm(algorithmId: number, stepId: number): Promise<boolean>;
  getStepsForAlgorithm(algorithmId: number): Promise<(Step & { orderNumber: number })[]>;
}
