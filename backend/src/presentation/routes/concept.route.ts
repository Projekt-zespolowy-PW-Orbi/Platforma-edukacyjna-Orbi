import { Router } from "express";
import type { ConceptController } from "presentation/controllers/concept.controller.js";

export function createConceptRouter(controller: ConceptController): Router {
  const router = Router();

  // CRUD endpoints
  router.get("/concepts", controller.list);
  router.get("/concepts/:id", controller.getById);
  router.post("/concepts", controller.create);
  router.put("/concepts/:id", controller.update);
  router.delete("/concepts/:id", controller.delete);

  // Concept relationship endpoints
  router.post("/concepts/:id/children", controller.addChild);
  router.delete("/concepts/:id/children/:childId", controller.removeChild);

  return router;
}
