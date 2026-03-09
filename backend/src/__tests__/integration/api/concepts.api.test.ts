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

describe("Concepts API", () => {
  describe("POST /api/concepts", () => {
    it("creates a concept and returns 201", async () => {
      const res = await request(app)
        .post("/api/concepts")
        .send({ name: "Algebra" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Algebra");
      expect(res.body.id).toBeGreaterThan(0);
    });
  });

  describe("GET /api/concepts/:id", () => {
    it("returns 200 with the concept", async () => {
      const create = await request(app)
        .post("/api/concepts")
        .send({ name: "Geometry" });

      const res = await request(app)
        .get(`/api/concepts/${String(create.body.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Geometry");
    });

    it("returns 404 for non-existent concept", async () => {
      const res = await request(app).get("/api/concepts/99999");
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      const res = await request(app).get("/api/concepts/abc");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/concepts", () => {
    it("returns paginated list", async () => {
      await request(app).post("/api/concepts").send({ name: "C1" });
      await request(app).post("/api/concepts").send({ name: "C2" });
      await request(app).post("/api/concepts").send({ name: "C3" });

      const res = await request(app)
        .get("/api/concepts?page=1&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.totalPages).toBe(2);
    });
  });

  describe("PUT /api/concepts/:id", () => {
    it("updates a concept and returns 200", async () => {
      const create = await request(app)
        .post("/api/concepts")
        .send({ name: "Old" });

      const res = await request(app)
        .put(`/api/concepts/${String(create.body.id)}`)
        .send({ name: "New" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("New");
    });

    it("returns 404 for non-existent concept", async () => {
      const res = await request(app)
        .put("/api/concepts/99999")
        .send({ name: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/concepts/:id", () => {
    it("deletes a concept and returns 204", async () => {
      const create = await request(app)
        .post("/api/concepts")
        .send({ name: "ToDelete" });

      const res = await request(app)
        .delete(`/api/concepts/${String(create.body.id)}`);

      expect(res.status).toBe(204);

      // Verify gone
      const get = await request(app)
        .get(`/api/concepts/${String(create.body.id)}`);
      expect(get.status).toBe(404);
    });

    it("returns 404 for non-existent concept", async () => {
      const res = await request(app).delete("/api/concepts/99999");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/concepts/:id/children", () => {
    it("adds a child concept and returns 201", async () => {
      const parent = await request(app)
        .post("/api/concepts")
        .send({ name: "Math" });
      const child = await request(app)
        .post("/api/concepts")
        .send({ name: "Algebra" });

      const res = await request(app)
        .post(`/api/concepts/${String(parent.body.id)}/children`)
        .send({ childId: child.body.id });

      expect(res.status).toBe(201);
      expect(res.body.parentConceptId).toBe(parent.body.id);
      expect(res.body.childConceptId).toBe(child.body.id);
    });
  });

  describe("DELETE /api/concepts/:id/children/:childId", () => {
    it("removes a child relationship and returns 204", async () => {
      const parent = await request(app)
        .post("/api/concepts")
        .send({ name: "Science" });
      const child = await request(app)
        .post("/api/concepts")
        .send({ name: "Physics" });

      await request(app)
        .post(`/api/concepts/${String(parent.body.id)}/children`)
        .send({ childId: child.body.id });

      const res = await request(app)
        .delete(`/api/concepts/${String(parent.body.id)}/children/${String(child.body.id)}`);

      expect(res.status).toBe(204);
    });

    it("returns 404 for non-existent relationship", async () => {
      const res = await request(app)
        .delete("/api/concepts/99999/children/99998");
      expect(res.status).toBe(404);
    });
  });
});
