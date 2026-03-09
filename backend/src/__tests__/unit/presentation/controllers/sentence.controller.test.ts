import { describe, it, expect, vi, beforeEach } from "vitest";
import { SentenceController } from "presentation/controllers/sentence.controller.js";
import { mockRequest, mockResponse } from "__tests__/unit/helpers/mock-express.js";
import type { Sentence, SentenceConcept, PaginatedResult } from "domain/types.js";

const now = new Date();

function makeSentence(overrides: Partial<Sentence> = {}): Sentence {
  return { id: 1, content: "2+2=4", createdAt: now, updatedAt: now, ...overrides };
}

function makeUseCases() {
  return {
    create: { execute: vi.fn() },
    get: { execute: vi.fn() },
    update: { execute: vi.fn() },
    delete: { execute: vi.fn() },
    list: { execute: vi.fn() },
    linkConcept: { execute: vi.fn() },
    unlinkConcept: { execute: vi.fn() },
  };
}

let useCases: ReturnType<typeof makeUseCases>;
let controller: SentenceController;

beforeEach(() => {
  useCases = makeUseCases();
  controller = new SentenceController(
    useCases.create as never,
    useCases.get as never,
    useCases.update as never,
    useCases.delete as never,
    useCases.list as never,
    useCases.linkConcept as never,
    useCases.unlinkConcept as never
  );
});

describe("SentenceController", () => {
  // ── create ──────────────────────────────────────────────
  describe("create", () => {
    it("returns 201 with created sentence", async () => {
      const sentence = makeSentence();
      useCases.create.execute.mockResolvedValue(sentence);

      const req = mockRequest({ body: { content: "2+2=4" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(sentence);
      expect(useCases.create.execute).toHaveBeenCalledWith({ content: "2+2=4" });
    });

    it("returns 500 when use case throws", async () => {
      useCases.create.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ body: { content: "X" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(500);
      expect(res._json).toEqual({ error: "Failed to create sentence" });
    });
  });

  // ── getById ─────────────────────────────────────────────
  describe("getById", () => {
    it("returns 200 with sentence when found", async () => {
      const sentence = makeSentence({ id: 3 });
      useCases.get.execute.mockResolvedValue(sentence);

      const req = mockRequest({ params: { id: "3" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._json).toEqual(sentence);
      expect(useCases.get.execute).toHaveBeenCalledWith(3);
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "bad" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._status).toBe(400);
      expect(useCases.get.execute).not.toHaveBeenCalled();
    });

    it("returns 404 when not found", async () => {
      useCases.get.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "999" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._status).toBe(404);
      expect(res._json).toEqual({ error: "Sentence not found" });
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
    it("returns paginated result", async () => {
      const result: PaginatedResult<Sentence> = {
        data: [makeSentence()],
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
    });

    it("converts query string params to numbers", async () => {
      useCases.list.execute.mockResolvedValue({
        data: [], total: 0, page: 3, limit: 20, totalPages: 0,
      });

      const req = mockRequest({ query: { page: "3", limit: "20" } });
      const res = mockResponse();
      await controller.list(req, res);

      expect(useCases.list.execute).toHaveBeenCalledWith({ page: 3, limit: 20 });
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
    it("returns 200 with updated sentence", async () => {
      const updated = makeSentence({ content: "New" });
      useCases.update.execute.mockResolvedValue(updated);

      const req = mockRequest({ params: { id: "1" }, body: { content: "New" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._json).toEqual(updated);
      expect(useCases.update.execute).toHaveBeenCalledWith(1, { content: "New" });
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "x" }, body: { content: "Y" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      useCases.update.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "999" }, body: { content: "X" } });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.update.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" }, body: {} });
      const res = mockResponse();
      await controller.update(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── delete ──────────────────────────────────────────────
  describe("delete", () => {
    it("returns 204 on success", async () => {
      useCases.delete.execute.mockResolvedValue(true);

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(204);
      expect(res._sent).toBe(true);
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "no" } });
      const res = mockResponse();
      await controller.delete(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when not found", async () => {
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

  // ── linkConcept ─────────────────────────────────────────
  describe("linkConcept", () => {
    it("returns 201 with link", async () => {
      const link: SentenceConcept = { sentenceId: 1, conceptId: 2, isTrue: true };
      useCases.linkConcept.execute.mockResolvedValue(link);

      const req = mockRequest({
        params: { id: "1" },
        body: { conceptId: 2, isTrue: true },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(link);
      expect(useCases.linkConcept.execute).toHaveBeenCalledWith(1, 2, true);
    });

    it("defaults isTrue to true when not provided", async () => {
      useCases.linkConcept.execute.mockResolvedValue({
        sentenceId: 1, conceptId: 2, isTrue: true,
      });

      const req = mockRequest({
        params: { id: "1" },
        body: { conceptId: 2 },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(useCases.linkConcept.execute).toHaveBeenCalledWith(1, 2, true);
    });

    it("passes isTrue=false when explicitly set", async () => {
      useCases.linkConcept.execute.mockResolvedValue({
        sentenceId: 1, conceptId: 2, isTrue: false,
      });

      const req = mockRequest({
        params: { id: "1" },
        body: { conceptId: 2, isTrue: false },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(useCases.linkConcept.execute).toHaveBeenCalledWith(1, 2, false);
    });

    it("returns 400 when sentenceId is invalid", async () => {
      const req = mockRequest({
        params: { id: "abc" },
        body: { conceptId: 2 },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 400 when conceptId is invalid", async () => {
      const req = mockRequest({
        params: { id: "1" },
        body: { conceptId: undefined },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 500 when use case throws", async () => {
      useCases.linkConcept.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({
        params: { id: "1" },
        body: { conceptId: 2 },
      });
      const res = mockResponse();
      await controller.linkConcept(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── unlinkConcept ───────────────────────────────────────
  describe("unlinkConcept", () => {
    it("returns 204 when unlinked", async () => {
      useCases.unlinkConcept.execute.mockResolvedValue(true);

      const req = mockRequest({ params: { id: "1", conceptId: "2" } });
      const res = mockResponse();
      await controller.unlinkConcept(req, res);

      expect(res._status).toBe(204);
      expect(useCases.unlinkConcept.execute).toHaveBeenCalledWith(1, 2);
    });

    it("returns 400 when sentenceId is invalid", async () => {
      const req = mockRequest({ params: { id: "bad", conceptId: "2" } });
      const res = mockResponse();
      await controller.unlinkConcept(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 400 when conceptId is invalid", async () => {
      const req = mockRequest({ params: { id: "1", conceptId: "bad" } });
      const res = mockResponse();
      await controller.unlinkConcept(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when relationship not found", async () => {
      useCases.unlinkConcept.execute.mockResolvedValue(false);

      const req = mockRequest({ params: { id: "1", conceptId: "2" } });
      const res = mockResponse();
      await controller.unlinkConcept(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.unlinkConcept.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1", conceptId: "2" } });
      const res = mockResponse();
      await controller.unlinkConcept(req, res);

      expect(res._status).toBe(500);
    });
  });
});
