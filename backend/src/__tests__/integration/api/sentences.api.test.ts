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

describe("Sentences API", () => {
  describe("POST /api/sentences", () => {
    it("creates a sentence and returns 201", async () => {
      const res = await request(app)
        .post("/api/sentences")
        .send({ content: "The sum of angles in a triangle is 180 degrees" });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe("The sum of angles in a triangle is 180 degrees");
      expect(res.body.id).toBeGreaterThan(0);
    });
  });

  describe("GET /api/sentences/:id", () => {
    it("returns 200 with the sentence", async () => {
      const create = await request(app)
        .post("/api/sentences")
        .send({ content: "E = mc^2" });

      const res = await request(app)
        .get(`/api/sentences/${String(create.body.id)}`);

      expect(res.status).toBe(200);
      expect(res.body.content).toBe("E = mc^2");
    });

    it("returns 404 for non-existent sentence", async () => {
      const res = await request(app).get("/api/sentences/99999");
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id", async () => {
      const res = await request(app).get("/api/sentences/notanumber");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/sentences", () => {
    it("returns paginated list", async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/sentences").send({ content: `S${String(i)}` });
      }

      const res = await request(app).get("/api/sentences?page=1&limit=3");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.total).toBe(5);
    });
  });

  describe("PUT /api/sentences/:id", () => {
    it("updates sentence content", async () => {
      const create = await request(app)
        .post("/api/sentences")
        .send({ content: "Old" });

      const res = await request(app)
        .put(`/api/sentences/${String(create.body.id)}`)
        .send({ content: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Updated");
    });

    it("returns 404 for non-existent", async () => {
      const res = await request(app)
        .put("/api/sentences/99999")
        .send({ content: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/sentences/:id", () => {
    it("deletes and returns 204", async () => {
      const create = await request(app)
        .post("/api/sentences")
        .send({ content: "Bye" });

      const res = await request(app)
        .delete(`/api/sentences/${String(create.body.id)}`);
      expect(res.status).toBe(204);
    });
  });

  describe("sentence-concept linking via API", () => {
    it("links a concept to a sentence (POST) and unlinks (DELETE)", async () => {
      const concept = await request(app)
        .post("/api/concepts")
        .send({ name: "Geometry" });
      const sentence = await request(app)
        .post("/api/sentences")
        .send({ content: "A square has 4 sides" });

      // Link
      const link = await request(app)
        .post(`/api/sentences/${String(sentence.body.id)}/concepts`)
        .send({ conceptId: concept.body.id, isTrue: true });

      expect(link.status).toBe(201);
      expect(link.body.sentenceId).toBe(sentence.body.id);
      expect(link.body.conceptId).toBe(concept.body.id);
      expect(link.body.isTrue).toBe(true);

      // Unlink
      const unlink = await request(app)
        .delete(`/api/sentences/${String(sentence.body.id)}/concepts/${String(concept.body.id)}`);
      expect(unlink.status).toBe(204);
    });

    it("defaults isTrue to true when not provided", async () => {
      const concept = await request(app)
        .post("/api/concepts")
        .send({ name: "Logic" });
      const sentence = await request(app)
        .post("/api/sentences")
        .send({ content: "If A then B" });

      const link = await request(app)
        .post(`/api/sentences/${String(sentence.body.id)}/concepts`)
        .send({ conceptId: concept.body.id });

      expect(link.status).toBe(201);
      expect(link.body.isTrue).toBe(true);
    });

    it("returns 404 when unlinking non-existent relationship", async () => {
      const res = await request(app)
        .delete("/api/sentences/99999/concepts/99998");
      expect(res.status).toBe(404);
    });
  });
});
