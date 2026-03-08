import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConceptController } from "presentation/controllers/concept.controller.js";
import { mockRequest, mockResponse } from "__tests__/unit/helpers/mock-express.js";
import type { Concept, ConceptGroup, PaginatedResult } from "domain/types.js";

const now = new Date();

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return { id: 1, name: "Algebra", createdAt: now, updatedAt: now, ...overrides };
}

function makeUseCases() {
  return {
    create: { execute: vi.fn() },
    get: { execute: vi.fn() },
    update: { execute: vi.fn() },
    delete: { execute: vi.fn() },
    list: { execute: vi.fn() },
    addChild: { execute: vi.fn() },
    removeChild: { execute: vi.fn() },
  };
}

let useCases: ReturnType<typeof makeUseCases>;
let controller: ConceptController;

beforeEach(() => {
  useCases = makeUseCases();
  controller = new ConceptController(
    useCases.create as never,
    useCases.get as never,
    useCases.update as never,
    useCases.delete as never,
    useCases.list as never,
    useCases.addChild as never,
    useCases.removeChild as never
  );
});

describe("ConceptController", () => {
  // ── create ──────────────────────────────────────────────
  describe("create", () => {
    it("returns 201 with created concept", async () => {
      const concept = makeConcept();
      useCases.create.execute.mockResolvedValue(concept);

      const req = mockRequest({ body: { name: "Algebra" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(concept);
      expect(useCases.create.execute).toHaveBeenCalledWith({
        name: "Algebra",
        description: undefined,
      });
    });

    it("passes description when provided", async () => {
      useCases.create.execute.mockResolvedValue(makeConcept());

      const req = mockRequest({ body: { name: "A", description: "Desc" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(useCases.create.execute).toHaveBeenCalledWith({
        name: "A",
        description: "Desc",
      });
    });

    it("returns 500 when use case throws", async () => {
      useCases.create.execute.mockRejectedValue(new Error("DB error"));

      const req = mockRequest({ body: { name: "X" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(500);
      expect(res._json).toEqual({ error: "Failed to create concept" });
    });
  });

  // ── getById ─────────────────────────────────────────────
  describe("getById", () => {
    it("returns 200 with concept when found", async () => {
      const concept = makeConcept({ id: 5 });
      useCases.get.execute.mockResolvedValue(concept);

      const req = mockRequest({ params: { id: "5" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._json).toEqual(concept);
      expect(res._status).toBeUndefined(); // 200 is default, no explicit status()
      expect(useCases.get.execute).toHaveBeenCalledWith(5);
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "abc" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._status).toBe(400);
      expect(res._json).toEqual({ error: "Invalid ID" });
      expect(useCases.get.execute).not.toHaveBeenCalled();
    });

    it("treats empty id as 0 (Number('') === 0) and returns 404", async () => {
      useCases.get.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "" } });
      const res = mockResponse();
      await controller.getById(req, res);

      // Number("") === 0 which is not NaN, so it passes validation
      // and gets dispatched to the use case which returns null → 404
      expect(res._status).toBe(404);
    });

    it("returns 404 when concept not found", async () => {
      useCases.get.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "999" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._status).toBe(404);
      expect(res._json).toEqual({ error: "Concept not found" });
    });

    it("returns 500 when use case throws", async () => {
      useCases.get.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── list ────────────────────────────────────────────────
  describe("list", () => {
    it("returns paginated result with default params", async () => {
      const result: PaginatedResult<Concept> = {
        data: [makeConcept()],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      useCases.list.execute.mockResolvedValue(result);

      const req = mockRequest();
      const res = mockResponse();
      await controller.list(req, res);

      expect(res._json).toEqual(result);
      expect(useCases.list.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
      });
    });

    it("passes page and limit from query params", async () => {
      useCases.list.execute.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 5,
        totalPages: 0,
      });

      const req = mockRequest({ query: { page: "2", limit: "5" } });
      const res = mockResponse();
      await controller.list(req, res);

      expect(useCases.list.execute).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
      });
    });

    it("returns 500 when use case throws", async () => {
      useCases.list.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest();
      const res = mockResponse();
      await controller.list(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── update ──────────────────────────────────────────────
  describe("update", () => {
    it("returns 200 with updated concept", async () => {
      const updated = makeConcept({ name: "New" });
      useCases.update.execute.mockResolvedValue(updated);

      const req = mockRequest({ params: { id: "1" }, body: { name: "New" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._json).toEqual(updated);
      expect(useCases.update.execute).toHaveBeenCalledWith(1, {
        name: "New",
        description: undefined,
      });
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "xyz" }, body: { name: "X" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(400);
      expect(useCases.update.execute).not.toHaveBeenCalled();
    });

    it("returns 404 when concept not found", async () => {
      useCases.update.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "999" }, body: { name: "X" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.update.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" }, body: { name: "X" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── delete ──────────────────────────────────────────────
  describe("delete", () => {
    it("returns 204 when deleted", async () => {
      useCases.delete.execute.mockResolvedValue(true);

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(204);
      expect(res._sent).toBe(true);
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "nope" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when concept not found", async () => {
      useCases.delete.execute.mockResolvedValue(false);

      const req = mockRequest({ params: { id: "999" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.delete.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── addChild ────────────────────────────────────────────
  describe("addChild", () => {
    it("returns 201 with relationship", async () => {
      const group: ConceptGroup = { parentConceptId: 1, childConceptId: 2 };
      useCases.addChild.execute.mockResolvedValue(group);

      const req = mockRequest({ params: { id: "1" }, body: { childId: 2 } });
      const res = mockResponse();
      await controller.addChild(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(group);
      expect(useCases.addChild.execute).toHaveBeenCalledWith(1, 2);
    });

    it("returns 400 when parentId is invalid", async () => {
      const req = mockRequest({ params: { id: "abc" }, body: { childId: 2 } });
      const res = mockResponse();
      await controller.addChild(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 400 when childId is invalid", async () => {
      const req = mockRequest({ params: { id: "1" }, body: { childId: undefined } });
      const res = mockResponse();
      await controller.addChild(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 500 when use case throws", async () => {
      useCases.addChild.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" }, body: { childId: 2 } });
      const res = mockResponse();
      await controller.addChild(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── removeChild ─────────────────────────────────────────
  describe("removeChild", () => {
    it("returns 204 when relationship removed", async () => {
      useCases.removeChild.execute.mockResolvedValue(true);

      const req = mockRequest({ params: { id: "1", childId: "2" } });
      const res = mockResponse();
      await controller.removeChild(req, res);

      expect(res._status).toBe(204);
      expect(useCases.removeChild.execute).toHaveBeenCalledWith(1, 2);
    });

    it("returns 400 when parentId is invalid", async () => {
      const req = mockRequest({ params: { id: "abc", childId: "2" } });
      const res = mockResponse();
      await controller.removeChild(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 400 when childId is invalid", async () => {
      const req = mockRequest({ params: { id: "1", childId: "abc" } });
      const res = mockResponse();
      await controller.removeChild(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when relationship not found", async () => {
      useCases.removeChild.execute.mockResolvedValue(false);

      const req = mockRequest({ params: { id: "1", childId: "2" } });
      const res = mockResponse();
      await controller.removeChild(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.removeChild.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1", childId: "2" } });
      const res = mockResponse();
      await controller.removeChild(req, res);

      expect(res._status).toBe(500);
    });
  });
});
