import { Router } from "express";
import { DoubleRequestSchema } from "@orbi/shared";
import { validateBody } from "../middleware/validate.js";
import type { DoubleController } from "../controllers/double.controller.js";

export function createDoubleRouter(controller: DoubleController): Router {
  const router = Router();
  router.post("/double", validateBody(DoubleRequestSchema), controller.handle);
  return router;
}
