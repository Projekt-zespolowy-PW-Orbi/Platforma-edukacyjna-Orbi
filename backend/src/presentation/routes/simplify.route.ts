import { Router } from "express";
import { SimplifyRequestSchema } from "@orbi/shared";
import { validateBody } from "presentation/middleware/validate.js";
import type { SimplifyController } from "presentation/controllers/simplify.controller.js";

export function createSimplifyRouter(controller: SimplifyController): Router {
  const router = Router();
  router.post("/simplify", validateBody(SimplifyRequestSchema), controller.handle);
  return router;
}