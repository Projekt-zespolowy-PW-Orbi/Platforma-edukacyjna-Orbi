import express, { type Express } from "express";
import type { Kysely } from "kysely";
import type { Database } from "infrastructure/database/types.js";

// Repositories
import {
  ConceptRepository,
  SentenceRepository,
  AlgorithmRepository,
} from "infrastructure/repositories/index.js";

// Concept use cases
import {
  CreateConceptUseCase,
  GetConceptUseCase,
  UpdateConceptUseCase,
  DeleteConceptUseCase,
  ListConceptsUseCase,
  AddChildConceptUseCase,
  RemoveChildConceptUseCase,
} from "application/use-cases/concept/index.js";

// Sentence use cases
import {
  CreateSentenceUseCase,
  GetSentenceUseCase,
  UpdateSentenceUseCase,
  DeleteSentenceUseCase,
  ListSentencesUseCase,
  LinkSentenceConceptUseCase,
  UnlinkSentenceConceptUseCase,
} from "application/use-cases/sentence/index.js";

// Algorithm use cases
import {
  CreateAlgorithmUseCase,
  GetAlgorithmUseCase,
  UpdateAlgorithmUseCase,
  DeleteAlgorithmUseCase,
  ListAlgorithmsUseCase,
  CreateStepUseCase,
  AddStepToAlgorithmUseCase,
  RemoveStepFromAlgorithmUseCase,
  GetAlgorithmStepsUseCase,
} from "application/use-cases/algorithm/index.js";

// Controllers
import { ConceptController } from "presentation/controllers/concept.controller.js";
import { SentenceController } from "presentation/controllers/sentence.controller.js";
import { AlgorithmController } from "presentation/controllers/algorithm.controller.js";

// Routes
import { createConceptRouter } from "presentation/routes/concept.route.js";
import { createSentenceRouter } from "presentation/routes/sentence.route.js";
import { createAlgorithmRouter } from "presentation/routes/algorithm.route.js";

export function buildApp(db: Kysely<Database>): Express {
  // Initialize repositories
  const conceptRepo = new ConceptRepository(db);
  const sentenceRepo = new SentenceRepository(db);
  const algorithmRepo = new AlgorithmRepository(db);

  // Initialize concept use cases
  const createConceptUseCase = new CreateConceptUseCase(conceptRepo);
  const getConceptUseCase = new GetConceptUseCase(conceptRepo);
  const updateConceptUseCase = new UpdateConceptUseCase(conceptRepo);
  const deleteConceptUseCase = new DeleteConceptUseCase(conceptRepo);
  const listConceptsUseCase = new ListConceptsUseCase(conceptRepo);
  const addChildConceptUseCase = new AddChildConceptUseCase(conceptRepo);
  const removeChildConceptUseCase = new RemoveChildConceptUseCase(conceptRepo);

  // Initialize sentence use cases
  const createSentenceUseCase = new CreateSentenceUseCase(sentenceRepo);
  const getSentenceUseCase = new GetSentenceUseCase(sentenceRepo);
  const updateSentenceUseCase = new UpdateSentenceUseCase(sentenceRepo);
  const deleteSentenceUseCase = new DeleteSentenceUseCase(sentenceRepo);
  const listSentencesUseCase = new ListSentencesUseCase(sentenceRepo);
  const linkSentenceConceptUseCase = new LinkSentenceConceptUseCase(sentenceRepo);
  const unlinkSentenceConceptUseCase = new UnlinkSentenceConceptUseCase(sentenceRepo);

  // Initialize algorithm use cases
  const createAlgorithmUseCase = new CreateAlgorithmUseCase(algorithmRepo);
  const getAlgorithmUseCase = new GetAlgorithmUseCase(algorithmRepo);
  const updateAlgorithmUseCase = new UpdateAlgorithmUseCase(algorithmRepo);
  const deleteAlgorithmUseCase = new DeleteAlgorithmUseCase(algorithmRepo);
  const listAlgorithmsUseCase = new ListAlgorithmsUseCase(algorithmRepo);
  const createStepUseCase = new CreateStepUseCase(algorithmRepo);
  const addStepToAlgorithmUseCase = new AddStepToAlgorithmUseCase(algorithmRepo);
  const removeStepFromAlgorithmUseCase = new RemoveStepFromAlgorithmUseCase(algorithmRepo);
  const getAlgorithmStepsUseCase = new GetAlgorithmStepsUseCase(algorithmRepo);

  // Initialize controllers
  const conceptController = new ConceptController(
    createConceptUseCase,
    getConceptUseCase,
    updateConceptUseCase,
    deleteConceptUseCase,
    listConceptsUseCase,
    addChildConceptUseCase,
    removeChildConceptUseCase
  );

  const sentenceController = new SentenceController(
    createSentenceUseCase,
    getSentenceUseCase,
    updateSentenceUseCase,
    deleteSentenceUseCase,
    listSentencesUseCase,
    linkSentenceConceptUseCase,
    unlinkSentenceConceptUseCase
  );

  const algorithmController = new AlgorithmController(
    createAlgorithmUseCase,
    getAlgorithmUseCase,
    updateAlgorithmUseCase,
    deleteAlgorithmUseCase,
    listAlgorithmsUseCase,
    createStepUseCase,
    addStepToAlgorithmUseCase,
    removeStepFromAlgorithmUseCase,
    getAlgorithmStepsUseCase
  );

  // Create routers
  const conceptRouter = createConceptRouter(conceptController);
  const sentenceRouter = createSentenceRouter(sentenceController);
  const algorithmRouter = createAlgorithmRouter(algorithmController);

  const app = express();
  app.use(express.json());

  // Register routes under /api prefix
  //TODO change it
  app.use("/api", conceptRouter);
  app.use("/api", sentenceRouter);
  app.use("/api", algorithmRouter);

  return app;
}
