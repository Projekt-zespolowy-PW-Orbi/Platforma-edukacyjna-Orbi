import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlgorithmController } from "presentation/controllers/algorithm.controller.js";
import { mockRequest, mockResponse } from "__tests__/unit/helpers/mock-express.js";
import type { Algorithm, Step, AlgorithmStep, PaginatedResult } from "domain/types.js";

const now = new Date();

function makeAlgorithm(overrides: Partial<Algorithm> = {}): Algorithm {
  return { id: 1, name: "GCD", createdAt: now, updatedAt: now, ...overrides };
}

function makeStep(overrides: Partial<Step> = {}): Step {
  return { id: 1, content: "Divide", createdAt: now, updatedAt: now, ...overrides };
}

function makeUseCases() {
  return {
    create: { execute: vi.fn() },
    get: { execute: vi.fn() },
    update: { execute: vi.fn() },
    delete: { execute: vi.fn() },
    list: { execute: vi.fn() },
    createStep: { execute: vi.fn() },
    addStep: { execute: vi.fn() },
    removeStep: { execute: vi.fn() },
    getSteps: { execute: vi.fn() },
  };
}

let useCases: ReturnType<typeof makeUseCases>;
let controller: AlgorithmController;

beforeEach(() => {
  useCases = makeUseCases();
  controller = new AlgorithmController(
    useCases.create as never,
    useCases.get as never,
    useCases.update as never,
    useCases.delete as never,
    useCases.list as never,
    useCases.createStep as never,
    useCases.addStep as never,
    useCases.removeStep as never,
    useCases.getSteps as never
  );
});

describe("AlgorithmController", () => {
  // ── create ──────────────────────────────────────────────
  describe("create", () => {
    it("returns 201 with created algorithm", async () => {
      const algo = makeAlgorithm();
      useCases.create.execute.mockResolvedValue(algo);

      const req = mockRequest({ body: { name: "GCD" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(algo);
      expect(useCases.create.execute).toHaveBeenCalledWith({
        name: "GCD",
        description: undefined,
      });
    });

    it("passes description when provided", async () => {
      useCases.create.execute.mockResolvedValue(makeAlgorithm());

      const req = mockRequest({ body: { name: "A", description: "D" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(useCases.create.execute).toHaveBeenCalledWith({
        name: "A",
        description: "D",
      });
    });

    it("returns 500 when use case throws", async () => {
      useCases.create.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ body: { name: "X" } });
      const res = mockResponse();
      await controller.create(req, res);

      expect(res._status).toBe(500);
      expect(res._json).toEqual({ error: "Failed to create algorithm" });
    });
  });

  // ── getById ─────────────────────────────────────────────
  describe("getById", () => {
    it("returns 200 with algorithm when found", async () => {
      const algo = makeAlgorithm({ id: 7 });
      useCases.get.execute.mockResolvedValue(algo);

      const req = mockRequest({ params: { id: "7" } });
      const res = mockResponse();
      await controller.getById(req, res);

      expect(res._json).toEqual(algo);
      expect(useCases.get.execute).toHaveBeenCalledWith(7);
    });

    it("returns 400 for non-numeric id", async () => {
      const req = mockRequest({ params: { id: "abc" } });
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
      expect(res._json).toEqual({ error: "Algorithm not found" });
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
    it("returns paginated result with query params", async () => {
      const result: PaginatedResult<Algorithm> = {
        data: [makeAlgorithm()],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      };
      useCases.list.execute.mockResolvedValue(result);

      const req = mockRequest({ query: { page: "2", limit: "5" } });
      const res = mockResponse();
      await controller.list(req, res);

      expect(res._json).toEqual(result);
      expect(useCases.list.execute).toHaveBeenCalledWith({ page: 2, limit: 5 });
    });

    it("passes undefined when no query params", async () => {
      useCases.list.execute.mockResolvedValue({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
      });

      const req = mockRequest();
      const res = mockResponse();
      await controller.list(req, res);

      expect(useCases.list.execute).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
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
    it("returns 200 with updated algorithm", async () => {
      const updated = makeAlgorithm({ name: "New" });
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
    });

    it("returns 404 when not found", async () => {
      useCases.update.execute.mockResolvedValue(null);

      const req = mockRequest({ params: { id: "999" }, body: { name: "X" } });
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
      const req = mockRequest({ params: { id: "nah" } });
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

  // ── createStep ──────────────────────────────────────────
  describe("createStep", () => {
    it("returns 201 with created step", async () => {
      const step = makeStep({ content: "Initialize" });
      useCases.createStep.execute.mockResolvedValue(step);

      const req = mockRequest({ body: { content: "Initialize" } });
      const res = mockResponse();
      await controller.createStep(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(step);
      expect(useCases.createStep.execute).toHaveBeenCalledWith({
        content: "Initialize",
        algorithmId: undefined,
      });
    });

    it("passes algorithmId when provided", async () => {
      useCases.createStep.execute.mockResolvedValue(makeStep());

      const req = mockRequest({ body: { content: "X", algorithmId: 5 } });
      const res = mockResponse();
      await controller.createStep(req, res);

      expect(useCases.createStep.execute).toHaveBeenCalledWith({
        content: "X",
        algorithmId: 5,
      });
    });

    it("returns 500 when use case throws", async () => {
      useCases.createStep.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ body: { content: "X" } });
      const res = mockResponse();
      await controller.createStep(req, res);

      expect(res._status).toBe(500);
      expect(res._json).toEqual({ error: "Failed to create step" });
    });
  });

  // ── addStep ─────────────────────────────────────────────
  describe("addStep", () => {
    it("returns 201 with algorithm-step link", async () => {
      const link: AlgorithmStep = { id: 1, algorithmId: 1, stepId: 2, orderNumber: 3 };
      useCases.addStep.execute.mockResolvedValue(link);

      const req = mockRequest({
        params: { id: "1" },
        body: { stepId: 2, orderNumber: 3 },
      });
      const res = mockResponse();
      await controller.addStep(req, res);

      expect(res._status).toBe(201);
      expect(res._json).toEqual(link);
      expect(useCases.addStep.execute).toHaveBeenCalledWith(1, 2, 3);
    });

    it("defaults orderNumber to 0 when not provided", async () => {
      useCases.addStep.execute.mockResolvedValue({
        id: 1, algorithmId: 1, stepId: 2, orderNumber: 0,
      });

      const req = mockRequest({
        params: { id: "1" },
        body: { stepId: 2 },
      });
      const res = mockResponse();
      await controller.addStep(req, res);

      expect(useCases.addStep.execute).toHaveBeenCalledWith(1, 2, 0);
    });

    it("returns 400 when algorithmId is invalid", async () => {
      const req = mockRequest({
        params: { id: "abc" },
        body: { stepId: 2 },
      });
      const res = mockResponse();
      await controller.addStep(req, res);

      expect(res._status).toBe(400);
      expect(useCases.addStep.execute).not.toHaveBeenCalled();
    });

    it("returns 400 when stepId is invalid", async () => {
      const req = mockRequest({
        params: { id: "1" },
        body: { stepId: undefined },
      });
      const res = mockResponse();
      await controller.addStep(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 500 when use case throws", async () => {
      useCases.addStep.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({
        params: { id: "1" },
        body: { stepId: 2 },
      });
      const res = mockResponse();
      await controller.addStep(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── removeStep ──────────────────────────────────────────
  describe("removeStep", () => {
    it("returns 204 when removed", async () => {
      useCases.removeStep.execute.mockResolvedValue(true);

      const req = mockRequest({ params: { id: "1", stepId: "2" } });
      const res = mockResponse();
      await controller.removeStep(req, res);

      expect(res._status).toBe(204);
      expect(useCases.removeStep.execute).toHaveBeenCalledWith(1, 2);
    });

    it("returns 400 when algorithmId is invalid", async () => {
      const req = mockRequest({ params: { id: "abc", stepId: "2" } });
      const res = mockResponse();
      await controller.removeStep(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 400 when stepId is invalid", async () => {
      const req = mockRequest({ params: { id: "1", stepId: "abc" } });
      const res = mockResponse();
      await controller.removeStep(req, res);

      expect(res._status).toBe(400);
    });

    it("returns 404 when not found", async () => {
      useCases.removeStep.execute.mockResolvedValue(false);

      const req = mockRequest({ params: { id: "1", stepId: "2" } });
      const res = mockResponse();
      await controller.removeStep(req, res);

      expect(res._status).toBe(404);
    });

    it("returns 500 when use case throws", async () => {
      useCases.removeStep.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1", stepId: "2" } });
      const res = mockResponse();
      await controller.removeStep(req, res);

      expect(res._status).toBe(500);
    });
  });

  // ── getSteps ────────────────────────────────────────────
  describe("getSteps", () => {
    it("returns 200 with steps array", async () => {
      const steps = [
        { ...makeStep({ content: "Step 1" }), orderNumber: 1 },
        { ...makeStep({ id: 2, content: "Step 2" }), orderNumber: 2 },
      ];
      useCases.getSteps.execute.mockResolvedValue(steps);

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.getSteps(req, res);

      expect(res._json).toEqual(steps);
      expect(useCases.getSteps.execute).toHaveBeenCalledWith(1);
    });

    it("returns 400 for non-numeric algorithmId", async () => {
      const req = mockRequest({ params: { id: "abc" } });
      const res = mockResponse();
      await controller.getSteps(req, res);

      expect(res._status).toBe(400);
      expect(useCases.getSteps.execute).not.toHaveBeenCalled();
    });

    it("returns 500 when use case throws", async () => {
      useCases.getSteps.execute.mockRejectedValue(new Error("fail"));

      const req = mockRequest({ params: { id: "1" } });
      const res = mockResponse();
      await controller.getSteps(req, res);

      expect(res._status).toBe(500);
    });
  });
});
