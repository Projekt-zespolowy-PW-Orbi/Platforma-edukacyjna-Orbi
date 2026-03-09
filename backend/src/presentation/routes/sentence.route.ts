import { Router } from "express";
import type { SentenceController } from "presentation/controllers/sentence.controller.js";

export function createSentenceRouter(controller: SentenceController): Router {
  const router = Router();

  // CRUD endpoints
  router.get("/sentences", controller.list);
  router.get("/sentences/:id", controller.getById);
  router.post("/sentences", controller.create);
  router.put("/sentences/:id", controller.update);
  router.delete("/sentences/:id", controller.delete);

  // Sentence concept relationship endpoints
  router.post("/sentences/:id/concepts", controller.linkConcept);
  router.delete("/sentences/:id/concepts/:conceptId", controller.unlinkConcept);

  return router;
}
