import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import { createSentenceRouter } from "presentation/routes/sentence.route.js";
import type { SentenceController } from "presentation/controllers/sentence.controller.js";

function makeStubController(): SentenceController {
  const ok = vi.fn((_req, res) => { res.json({ ok: true }); });
  return {
    list: ok,
    getById: ok,
    create: ok,
    update: ok,
    delete: ok,
    linkConcept: ok,
    unlinkConcept: ok,
  } as unknown as SentenceController;
}

function buildApp(controller: SentenceController) {
  const app = express();
  app.use(express.json());
  app.use("/api", createSentenceRouter(controller));
  return app;
}

describe("sentence routes", () => {
  it("GET /api/sentences calls list", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/sentences");
    expect(ctrl.list).toHaveBeenCalled();
  });

  it("GET /api/sentences/:id calls getById", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).get("/api/sentences/1");
    expect(ctrl.getById).toHaveBeenCalled();
  });

  it("POST /api/sentences calls create", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/sentences").send({ content: "X" });
    expect(ctrl.create).toHaveBeenCalled();
  });

  it("PUT /api/sentences/:id calls update", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).put("/api/sentences/1").send({ content: "X" });
    expect(ctrl.update).toHaveBeenCalled();
  });

  it("DELETE /api/sentences/:id calls delete", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/sentences/1");
    expect(ctrl.delete).toHaveBeenCalled();
  });

  it("POST /api/sentences/:id/concepts calls linkConcept", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).post("/api/sentences/1/concepts").send({ conceptId: 2 });
    expect(ctrl.linkConcept).toHaveBeenCalled();
  });

  it("DELETE /api/sentences/:id/concepts/:conceptId calls unlinkConcept", async () => {
    const ctrl = makeStubController();
    const app = buildApp(ctrl);
    await request(app).delete("/api/sentences/1/concepts/2");
    expect(ctrl.unlinkConcept).toHaveBeenCalled();
  });
});
