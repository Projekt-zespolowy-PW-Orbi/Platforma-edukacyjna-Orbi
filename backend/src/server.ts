import express, { type Express } from "express";
import { EngineAdapter } from "infrastructure/engine.adapter.js";
import { DoubleUseCase } from "application/use-cases/double.use-case.js";
import { DoubleController } from "presentation/controllers/double.controller.js";
import { createDoubleRouter } from "presentation/routes/double.route.js";

export function buildApp(): { app: Express; shutdown: () => void } {
  const engine = new EngineAdapter();
  const doubleUseCase = new DoubleUseCase(engine);
  const doubleController = new DoubleController(doubleUseCase);
  const doubleRouter = createDoubleRouter(doubleController);

  const app = express();
  app.use(express.json());
  app.use(doubleRouter);

  return { app, shutdown: () => engine.shutdown() };
}

const isMain =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` ||
    import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`);

if (isMain) {
  const { app, shutdown } = buildApp();
  const port = Number(process.env["PORT"] ?? 3001);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });

  const onSignal = () => {
    shutdown();
    server.close();
  };

  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
}
