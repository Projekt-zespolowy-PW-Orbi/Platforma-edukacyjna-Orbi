import { Router } from "express";
import type { AlgorithmController } from "presentation/controllers/algorithm.controller.js";

export function createAlgorithmRouter(controller: AlgorithmController): Router {
  const router = Router();

  // CRUD endpoints for algorithms
  router.get("/algorithms", controller.list);
  router.get("/algorithms/:id", controller.getById);
  router.post("/algorithms", controller.create);
  router.put("/algorithms/:id", controller.update);
  router.delete("/algorithms/:id", controller.delete);

  // Step endpoints
  router.post("/steps", controller.createStep);

  // Algorithm step relationship endpoints
  router.get("/algorithms/:id/steps", controller.getSteps);
  router.post("/algorithms/:id/steps", controller.addStep);
  router.delete("/algorithms/:id/steps/:stepId", controller.removeStep);

  return router;
}
