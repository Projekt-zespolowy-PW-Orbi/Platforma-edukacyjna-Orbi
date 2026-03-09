import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { setupTestDb, cleanTables, teardownTestDb } from "__tests__/helpers/db.js";
import { buildApp } from "server.js";

let app: ReturnType<typeof buildApp>["app"];

beforeAll(async () => {
  await setupTestDb();
  const built = buildApp();
  app = built.app;
});

beforeEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("Algorithms API", () => {
  describe("POST /api/algorithms", () => {
    it("creates an algorithm and returns 201", async () => {
      const res = await request(app)
        .post("/api/algorithms")
        .send({ name: "Euclidean GCD" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Euclidean GCD");
      expect(res.body.id).toBeGreaterThan(0);
    });
  });

  describe("GET /api/algorithms/:id", () => {
    it("returns 200 with the algorithm", async () => {
      const create = await request(app)
        .post("/api/algorithms")
        .send({ name: "Binary Search" });

      const res = await request(app)
        .get(`/api/algorithms/${String(create.body.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Binary Search");
    });

    it("returns 404 for non-existent", async () => {
      const res = await request(app).get("/api/algorithms/99999");
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      const res = await request(app).get("/api/algorithms/xyz");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/algorithms", () => {
    it("returns paginated list", async () => {
      await request(app).post("/api/algorithms").send({ name: "A1" });
      await request(app).post("/api/algorithms").send({ name: "A2" });
      await request(app).post("/api/algorithms").send({ name: "A3" });

      const res = await request(app).get("/api/algorithms?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
    });
  });

  describe("PUT /api/algorithms/:id", () => {
    it("updates algorithm name", async () => {
      const create = await request(app)
        .post("/api/algorithms")
        .send({ name: "Old Name" });

      const res = await request(app)
        .put(`/api/algorithms/${String(create.body.id)}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New Name");
    });

    it("returns 404 for non-existent", async () => {
      const res = await request(app)
        .put("/api/algorithms/99999")
        .send({ name: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/algorithms/:id", () => {
    it("deletes and returns 204", async () => {
      const create = await request(app)
        .post("/api/algorithms")
        .send({ name: "ToDelete" });

      const res = await request(app)
        .delete(`/api/algorithms/${String(create.body.id)}`);
      expect(res.status).toBe(204);

      const get = await request(app)
        .get(`/api/algorithms/${String(create.body.id)}`);
      expect(get.status).toBe(404);
    });
  });

  describe("steps management", () => {
    it("creates a step via POST /api/steps", async () => {
      const res = await request(app)
        .post("/api/steps")
        .send({ content: "Initialize variables" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Initialize variables");
    });

    it("adds steps to algorithm and retrieves them ordered", async () => {
      const algo = await request(app)
        .post("/api/algorithms")
        .send({ name: "Bubble Sort" });

      const s1 = await request(app)
        .post("/api/steps")
        .send({ content: "Outer loop" });
      const s2 = await request(app)
        .post("/api/steps")
        .send({ content: "Inner loop" });
      const s3 = await request(app)
        .post("/api/steps")
        .send({ content: "Compare and swap" });

      await request(app)
        .post(`/api/algorithms/${String(algo.body.id)}/steps`)
        .send({ stepId: s3.body.id, orderNumber: 3 });
      await request(app)
        .post(`/api/algorithms/${String(algo.body.id)}/steps`)
        .send({ stepId: s1.body.id, orderNumber: 1 });
      await request(app)
        .post(`/api/algorithms/${String(algo.body.id)}/steps`)
        .send({ stepId: s2.body.id, orderNumber: 2 });

      const steps = await request(app)
        .get(`/api/algorithms/${String(algo.body.id)}/steps`);

      expect(steps.status).toBe(200);
      expect(steps.body).toHaveLength(3);
      expect(steps.body[0].content).toBe("Outer loop");
      expect(steps.body[0].orderNumber).toBe(1);
      expect(steps.body[1].content).toBe("Inner loop");
      expect(steps.body[2].content).toBe("Compare and swap");
    });

    it("removes a step from algorithm", async () => {
      const algo = await request(app)
        .post("/api/algorithms")
        .send({ name: "Algo" });
      const step = await request(app)
        .post("/api/steps")
        .send({ content: "Step 1" });

      await request(app)
        .post(`/api/algorithms/${String(algo.body.id)}/steps`)
        .send({ stepId: step.body.id, orderNumber: 1 });

      const res = await request(app)
        .delete(`/api/algorithms/${String(algo.body.id)}/steps/${String(step.body.id)}`);
      expect(res.status).toBe(204);

      const steps = await request(app)
        .get(`/api/algorithms/${String(algo.body.id)}/steps`);
      expect(steps.body).toHaveLength(0);
    });

    it("returns 404 when removing non-existent step association", async () => {
      const res = await request(app)
        .delete("/api/algorithms/99999/steps/99998");
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid algorithm id in getSteps", async () => {
      const res = await request(app).get("/api/algorithms/abc/steps");
      expect(res.status).toBe(400);
    });
  });
});
