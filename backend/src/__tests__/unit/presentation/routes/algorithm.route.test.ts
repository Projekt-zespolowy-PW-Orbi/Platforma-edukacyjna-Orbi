import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { createAlgorithmRouter } from "presentation/routes/algorithm.route.js";
import type { AlgorithmController } from "presentation/controllers/algorithm.controller.js";

function makeStubController(): AlgorithmController {
  const ok = vi.fn((_req, res) => { res.json({ ok: true }); });
  return {
    list: ok,
    getById: ok,
    create: ok,
    update: ok,
    delete: ok,
    createStep: ok,
    addStep: ok,
    removeStep: ok,
    getSteps: ok,
  } as unknown as AlgorithmController;
}

function buildApp(controller: AlgorithmController) {
  const app = express();
  app.use(express.json());
  app.use("/api", createAlgorithmRouter(controller));
  return app;
}

describe("algorithm routes", () => {
  it("GET /api/algorithms calls list", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/algorithms");
    expect(ctrl.list).toHaveBeenCalled();
  });

  it("GET /api/algorithms/:id calls getById", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/algorithms/1");
    expect(ctrl.getById).toHaveBeenCalled();
  });

  it("POST /api/algorithms calls create", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/algorithms").send({ name: "X" });
    expect(ctrl.create).toHaveBeenCalled();
  });

  it("PUT /api/algorithms/:id calls update", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).put("/api/algorithms/1").send({ name: "X" });
    expect(ctrl.update).toHaveBeenCalled();
  });

  it("DELETE /api/algorithms/:id calls delete", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/algorithms/1");
    expect(ctrl.delete).toHaveBeenCalled();
  });

  it("POST /api/steps calls createStep", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/steps").send({ content: "X" });
    expect(ctrl.createStep).toHaveBeenCalled();
  });

  it("GET /api/algorithms/:id/steps calls getSteps", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/algorithms/1/steps");
    expect(ctrl.getSteps).toHaveBeenCalled();
  });

  it("POST /api/algorithms/:id/steps calls addStep", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/algorithms/1/steps").send({ stepId: 2 });
    expect(ctrl.addStep).toHaveBeenCalled();
  });

  it("DELETE /api/algorithms/:id/steps/:stepId calls removeStep", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/algorithms/1/steps/2");
    expect(ctrl.removeStep).toHaveBeenCalled();
  });
});
