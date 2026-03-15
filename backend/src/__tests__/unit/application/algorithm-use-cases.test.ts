import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateAlgorithmUseCase } from "application/use-cases/algorithm/create-algorithm.use-case.js";
import { GetAlgorithmUseCase } from "application/use-cases/algorithm/get-algorithm.use-case.js";
import { UpdateAlgorithmUseCase } from "application/use-cases/algorithm/update-algorithm.use-case.js";
import { DeleteAlgorithmUseCase } from "application/use-cases/algorithm/delete-algorithm.use-case.js";
import { ListAlgorithmsUseCase } from "application/use-cases/algorithm/list-algorithms.use-case.js";
import { CreateStepUseCase } from "application/use-cases/algorithm/create-step.use-case.js";
import { AddStepToAlgorithmUseCase } from "application/use-cases/algorithm/add-step-to-algorithm.use-case.js";
import { RemoveStepFromAlgorithmUseCase } from "application/use-cases/algorithm/remove-step-from-algorithm.use-case.js";
import { GetAlgorithmStepsUseCase } from "application/use-cases/algorithm/get-algorithm-steps.use-case.js";
import type { AlgorithmRepositoryPort } from "domain/ports/repositories/algorithm.repository.port.js";
import type { Algorithm, Step, PaginatedResult } from "domain/types.js";

const now = new Date();
const algo: Algorithm = { id: 1, name: "GCD", createdAt: now, updatedAt: now };
const step: Step = { id: 1, content: "Divide", createdAt: now, updatedAt: now };

function mockRepo(): { [K in keyof AlgorithmRepositoryPort]: ReturnType<typeof vi.fn> } {
  return {
    createAlgorithm: vi.fn(),
    findAlgorithmById: vi.fn(),
    findAllAlgorithms: vi.fn(),
    updateAlgorithm: vi.fn(),
    deleteAlgorithm: vi.fn(),
    createStep: vi.fn(),
    findStepById: vi.fn(),
    findAllSteps: vi.fn(),
    updateStep: vi.fn(),
    deleteStep: vi.fn(),
    addStepToAlgorithm: vi.fn(),
    removeStepFromAlgorithm: vi.fn(),
    getStepsForAlgorithm: vi.fn(),
  };
}

let repo: ReturnType<typeof mockRepo>;

beforeEach(() => {
  repo = mockRepo();
});

describe("Algorithm Use Cases", () => {
  // ── Algorithm CRUD ──────────────────────────────────────
  describe("CreateAlgorithmUseCase", () => {
    it("delegates to repo.createAlgorithm", async () => {
      repo.createAlgorithm.mockResolvedValue(algo);
      const uc = new CreateAlgorithmUseCase(repo);

      const result = await uc.execute({ name: "GCD" });

      expect(repo.createAlgorithm).toHaveBeenCalledWith({ name: "GCD" });
      expect(result).toEqual(algo);
    });

    it("propagates errors", async () => {
      repo.createAlgorithm.mockRejectedValue(new Error("dup"));
      const uc = new CreateAlgorithmUseCase(repo);

      await expect(uc.execute({ name: "Dup" })).rejects.toThrow("dup");
    });
  });

  describe("GetAlgorithmUseCase", () => {
    it("delegates to repo.findAlgorithmById", async () => {
      repo.findAlgorithmById.mockResolvedValue(algo);
      const uc = new GetAlgorithmUseCase(repo);

      expect(await uc.execute(1)).toEqual(algo);
      expect(repo.findAlgorithmById).toHaveBeenCalledWith(1);
    });

    it("returns null when not found", async () => {
      repo.findAlgorithmById.mockResolvedValue(null);
      const uc = new GetAlgorithmUseCase(repo);

      expect(await uc.execute(999)).toBeNull();
    });
  });

  describe("UpdateAlgorithmUseCase", () => {
    it("delegates to repo.updateAlgorithm", async () => {
      const updated = { ...algo, name: "LCM" };
      repo.updateAlgorithm.mockResolvedValue(updated);
      const uc = new UpdateAlgorithmUseCase(repo);

      const result = await uc.execute(1, { name: "LCM" });

      expect(repo.updateAlgorithm).toHaveBeenCalledWith(1, { name: "LCM" });
      expect(result).toEqual(updated);
    });

    it("returns null when not found", async () => {
      repo.updateAlgorithm.mockResolvedValue(null);
      const uc = new UpdateAlgorithmUseCase(repo);

      expect(await uc.execute(999, { name: "X" })).toBeNull();
    });
  });

  describe("DeleteAlgorithmUseCase", () => {
    it("delegates to repo.deleteAlgorithm", async () => {
      repo.deleteAlgorithm.mockResolvedValue(true);
      const uc = new DeleteAlgorithmUseCase(repo);

      expect(await uc.execute(1)).toBe(true);
      expect(repo.deleteAlgorithm).toHaveBeenCalledWith(1);
    });

    it("returns false when not found", async () => {
      repo.deleteAlgorithm.mockResolvedValue(false);
      const uc = new DeleteAlgorithmUseCase(repo);

      expect(await uc.execute(999)).toBe(false);
    });
  });

  describe("ListAlgorithmsUseCase", () => {
    it("delegates to repo.findAllAlgorithms with params", async () => {
      const page: PaginatedResult<Algorithm> = {
        data: [algo], total: 1, page: 1, limit: 10, totalPages: 1,
      };
      repo.findAllAlgorithms.mockResolvedValue(page);
      const uc = new ListAlgorithmsUseCase(repo);

      const result = await uc.execute({ page: 1, limit: 10 });

      expect(repo.findAllAlgorithms).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(page);
    });

    it("works without params", async () => {
      repo.findAllAlgorithms.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      const uc = new ListAlgorithmsUseCase(repo);

      await uc.execute();

      expect(repo.findAllAlgorithms).toHaveBeenCalledWith(undefined);
    });
  });

  // ── Step CRUD ───────────────────────────────────────────
  describe("CreateStepUseCase", () => {
    it("delegates to repo.createStep", async () => {
      repo.createStep.mockResolvedValue(step);
      const uc = new CreateStepUseCase(repo);

      const result = await uc.execute({ content: "Divide" });

      expect(repo.createStep).toHaveBeenCalledWith({ content: "Divide" });
      expect(result).toEqual(step);
    });

    it("passes algorithmId when provided", async () => {
      repo.createStep.mockResolvedValue({ ...step, algorithmId: 5 });
      const uc = new CreateStepUseCase(repo);

      await uc.execute({ content: "X", algorithmId: 5 });

      expect(repo.createStep).toHaveBeenCalledWith({ content: "X", algorithmId: 5 });
    });

    it("propagates errors", async () => {
      repo.createStep.mockRejectedValue(new Error("fail"));
      const uc = new CreateStepUseCase(repo);

      await expect(uc.execute({ content: "X" })).rejects.toThrow("fail");
    });
  });

  // ── Algorithm-Step associations ─────────────────────────
  describe("AddStepToAlgorithmUseCase", () => {
    it("delegates to repo.addStepToAlgorithm with all three args", async () => {
      const link = { id: 1, algorithmId: 1, stepId: 2, orderNumber: 3 };
      repo.addStepToAlgorithm.mockResolvedValue(link);
      const uc = new AddStepToAlgorithmUseCase(repo);

      const result = await uc.execute(1, 2, 3);

      expect(repo.addStepToAlgorithm).toHaveBeenCalledWith(1, 2, 3);
      expect(result).toEqual(link);
    });

    it("propagates duplicate order errors", async () => {
      repo.addStepToAlgorithm.mockRejectedValue(new Error("dup order"));
      const uc = new AddStepToAlgorithmUseCase(repo);

      await expect(uc.execute(1, 2, 1)).rejects.toThrow("dup order");
    });
  });

  describe("RemoveStepFromAlgorithmUseCase", () => {
    it("delegates to repo.removeStepFromAlgorithm", async () => {
      repo.removeStepFromAlgorithm.mockResolvedValue(true);
      const uc = new RemoveStepFromAlgorithmUseCase(repo);

      expect(await uc.execute(1, 2)).toBe(true);
      expect(repo.removeStepFromAlgorithm).toHaveBeenCalledWith(1, 2);
    });

    it("returns false when association does not exist", async () => {
      repo.removeStepFromAlgorithm.mockResolvedValue(false);
      const uc = new RemoveStepFromAlgorithmUseCase(repo);

      expect(await uc.execute(99, 98)).toBe(false);
    });
  });

  describe("GetAlgorithmStepsUseCase", () => {
    it("delegates to repo.getStepsForAlgorithm", async () => {
      const steps = [
        { ...step, orderNumber: 1 },
        { ...step, id: 2, content: "Mod", orderNumber: 2 },
      ];
      repo.getStepsForAlgorithm.mockResolvedValue(steps);
      const uc = new GetAlgorithmStepsUseCase(repo);

      const result = await uc.execute(1);

      expect(repo.getStepsForAlgorithm).toHaveBeenCalledWith(1);
      expect(result).toEqual(steps);
      expect(result).toHaveLength(2);
    });

    it("returns empty array when no steps exist", async () => {
      repo.getStepsForAlgorithm.mockResolvedValue([]);
      const uc = new GetAlgorithmStepsUseCase(repo);

      expect(await uc.execute(1)).toEqual([]);
    });
  });
});
