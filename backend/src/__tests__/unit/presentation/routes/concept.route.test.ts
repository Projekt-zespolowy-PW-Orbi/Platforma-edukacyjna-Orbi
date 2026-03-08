import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { createConceptRouter } from "presentation/routes/concept.route.js";
import type { ConceptController } from "presentation/controllers/concept.controller.js";

function makeStubController(): ConceptController {
  const ok = vi.fn((_req, res) => { res.json({ ok: true }); });
  return {
    list: ok,
    getById: ok,
    create: ok,
    update: ok,
    delete: ok,
    addChild: ok,
    removeChild: ok,
  } as unknown as ConceptController;
}

function buildApp(controller: ConceptController) {
  const app = express();
  app.use(express.json());
  app.use("/api", createConceptRouter(controller));
  return app;
}

describe("concept routes", () => {
  it("GET /api/concepts calls list", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/concepts");
    expect(ctrl.list).toHaveBeenCalled();
  });

  it("GET /api/concepts/:id calls getById", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/concepts/1");
    expect(ctrl.getById).toHaveBeenCalled();
  });

  it("POST /api/concepts calls create", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/concepts").send({ name: "X" });
    expect(ctrl.create).toHaveBeenCalled();
  });

  it("PUT /api/concepts/:id calls update", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).put("/api/concepts/1").send({ name: "X" });
    expect(ctrl.update).toHaveBeenCalled();
  });

  it("DELETE /api/concepts/:id calls delete", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/concepts/1");
    expect(ctrl.delete).toHaveBeenCalled();
  });

  it("POST /api/concepts/:id/children calls addChild", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/concepts/1/children").send({ childId: 2 });
    expect(ctrl.addChild).toHaveBeenCalled();
  });

  it("DELETE /api/concepts/:id/children/:childId calls removeChild", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/concepts/1/children/2");
    expect(ctrl.removeChild).toHaveBeenCalled();
  });
});
