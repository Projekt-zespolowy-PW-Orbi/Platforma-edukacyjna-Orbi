import { Router } from "express";
import { DoubleRequestSchema } from "@orbi/shared";
import { validateBody } from "presentation/middleware/validate.js";
import type { DoubleController } from "presentation/controllers/double.controller.js";

export function createDoubleRouter(controller: DoubleController): Router {
  const router = Router();
  router.post("/double", validateBody(DoubleRequestSchema), controller.handle);
  return router;
}
