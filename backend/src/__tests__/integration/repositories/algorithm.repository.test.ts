import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { setupTestDb, cleanTables, teardownTestDb } from "__tests__/helpers/db.js";
import { AlgorithmRepository } from "infrastructure/repositories/algorithm.repository.js";

let repo: AlgorithmRepository;

beforeAll(async () => {
  const db = await setupTestDb();
  repo = new AlgorithmRepository(db);
});

beforeEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("AlgorithmRepository", () => {
  describe("algorithm CRUD", () => {
    it("creates an algorithm", async () => {
      const algo = await repo.createAlgorithm({ name: "Bubble Sort" });

      expect(algo.id).toBeGreaterThan(0);
      expect(algo.name).toBe("Bubble Sort");
    });

    it("rejects duplicate algorithm names", async () => {
      await repo.createAlgorithm({ name: "Quick Sort" });
      await expect(repo.createAlgorithm({ name: "Quick Sort" })).rejects.toThrow();
    });

    it("finds algorithm by id", async () => {
      const created = await repo.createAlgorithm({ name: "Merge Sort" });
      const found = await repo.findAlgorithmById(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe("Merge Sort");
    });

    it("returns null for non-existent algorithm", async () => {
      expect(await repo.findAlgorithmById(99999)).toBeNull();
    });

    it("lists algorithms with pagination", async () => {
      for (let i = 1; i <= 7; i++) {
        await repo.createAlgorithm({ name: `Algo ${String(i)}` });
      }

      const page = await repo.findAllAlgorithms({ page: 1, limit: 3 });
      expect(page.data).toHaveLength(3);
      expect(page.total).toBe(7);
      expect(page.totalPages).toBe(3);
    });

    it("updates an algorithm", async () => {
      const created = await repo.createAlgorithm({ name: "Old Algo" });
      const updated = await repo.updateAlgorithm(created.id, { name: "New Algo" });

      expect(updated!.name).toBe("New Algo");

      const found = await repo.findAlgorithmById(created.id);
      expect(found!.name).toBe("New Algo");
    });

    it("returns null when updating non-existent algorithm", async () => {
      expect(await repo.updateAlgorithm(99999, { name: "X" })).toBeNull();
    });

    it("deletes an algorithm", async () => {
      const created = await repo.createAlgorithm({ name: "ToDelete" });
      expect(await repo.deleteAlgorithm(created.id)).toBe(true);
      expect(await repo.findAlgorithmById(created.id)).toBeNull();
    });

    it("returns false when deleting non-existent algorithm", async () => {
      expect(await repo.deleteAlgorithm(99999)).toBe(false);
    });
  });

  describe("step CRUD", () => {
    it("creates a standalone step (no algorithm reference)", async () => {
      const step = await repo.createStep({ content: "Compare elements" });

      expect(step.id).toBeGreaterThan(0);
      expect(step.content).toBe("Compare elements");
      expect(step.algorithmId).toBeUndefined();
    });

    it("creates a step referencing an algorithm", async () => {
      const algo = await repo.createAlgorithm({ name: "GCD" });
      const step = await repo.createStep({ content: "Divide", algorithmId: algo.id });

      expect(step.algorithmId).toBe(algo.id);
    });

    it("finds step by id", async () => {
      const created = await repo.createStep({ content: "Swap" });
      const found = await repo.findStepById(created.id);

      expect(found).not.toBeNull();
      expect(found!.content).toBe("Swap");
    });

    it("updates a step", async () => {
      const created = await repo.createStep({ content: "Old step" });
      const updated = await repo.updateStep(created.id, { content: "New step" });

      expect(updated!.content).toBe("New step");
    });

    it("deletes a step", async () => {
      const created = await repo.createStep({ content: "Delete me" });
      expect(await repo.deleteStep(created.id)).toBe(true);
      expect(await repo.findStepById(created.id)).toBeNull();
    });
  });

  describe("algorithm-step ordering", () => {
    it("adds steps to an algorithm with explicit order", async () => {
      const algo = await repo.createAlgorithm({ name: "Bubble Sort" });
      const s1 = await repo.createStep({ content: "Start loop" });
      const s2 = await repo.createStep({ content: "Compare adjacent" });
      const s3 = await repo.createStep({ content: "Swap if needed" });

      await repo.addStepToAlgorithm(algo.id, s1.id, 1);
      await repo.addStepToAlgorithm(algo.id, s2.id, 2);
      await repo.addStepToAlgorithm(algo.id, s3.id, 3);

      const steps = await repo.getStepsForAlgorithm(algo.id);
      expect(steps).toHaveLength(3);
      expect(steps[0]!.content).toBe("Start loop");
      expect(steps[0]!.orderNumber).toBe(1);
      expect(steps[1]!.content).toBe("Compare adjacent");
      expect(steps[1]!.orderNumber).toBe(2);
      expect(steps[2]!.content).toBe("Swap if needed");
      expect(steps[2]!.orderNumber).toBe(3);
    });

    it("returns steps sorted by order number", async () => {
      const algo = await repo.createAlgorithm({ name: "Test Algo" });
      const s1 = await repo.createStep({ content: "Third" });
      const s2 = await repo.createStep({ content: "First" });
      const s3 = await repo.createStep({ content: "Second" });

      // Insert in non-sequential order
      await repo.addStepToAlgorithm(algo.id, s1.id, 3);
      await repo.addStepToAlgorithm(algo.id, s2.id, 1);
      await repo.addStepToAlgorithm(algo.id, s3.id, 2);

      const steps = await repo.getStepsForAlgorithm(algo.id);
      expect(steps.map((s) => s.content)).toEqual(["First", "Second", "Third"]);
    });

    it("enforces unique order number per algorithm", async () => {
      const algo = await repo.createAlgorithm({ name: "Algo" });
      const s1 = await repo.createStep({ content: "Step A" });
      const s2 = await repo.createStep({ content: "Step B" });

      await repo.addStepToAlgorithm(algo.id, s1.id, 1);

      // Same algorithm, same order number -> should fail
      await expect(repo.addStepToAlgorithm(algo.id, s2.id, 1)).rejects.toThrow();
    });

    it("allows same order number in different algorithms", async () => {
      const algo1 = await repo.createAlgorithm({ name: "Algo A" });
      const algo2 = await repo.createAlgorithm({ name: "Algo B" });
      const s1 = await repo.createStep({ content: "Step 1" });
      const s2 = await repo.createStep({ content: "Step 2" });

      await repo.addStepToAlgorithm(algo1.id, s1.id, 1);
      await repo.addStepToAlgorithm(algo2.id, s2.id, 1);

      const steps1 = await repo.getStepsForAlgorithm(algo1.id);
      const steps2 = await repo.getStepsForAlgorithm(algo2.id);
      expect(steps1).toHaveLength(1);
      expect(steps2).toHaveLength(1);
    });

    it("removes a step from an algorithm", async () => {
      const algo = await repo.createAlgorithm({ name: "Algo" });
      const step = await repo.createStep({ content: "Step" });
      await repo.addStepToAlgorithm(algo.id, step.id, 1);

      const removed = await repo.removeStepFromAlgorithm(algo.id, step.id);
      expect(removed).toBe(true);

      const steps = await repo.getStepsForAlgorithm(algo.id);
      expect(steps).toHaveLength(0);
    });

    it("returns false when removing non-existent step association", async () => {
      expect(await repo.removeStepFromAlgorithm(99999, 99998)).toBe(false);
    });

    it("cascades - deleting algorithm removes step associations", async () => {
      const algo = await repo.createAlgorithm({ name: "Algo" });
      const step = await repo.createStep({ content: "Orphan step" });
      await repo.addStepToAlgorithm(algo.id, step.id, 1);

      await repo.deleteAlgorithm(algo.id);

      // Step still exists but is no longer associated
      const stepFound = await repo.findStepById(step.id);
      expect(stepFound).not.toBeNull();
    });

    it("returns empty array for algorithm with no steps", async () => {
      const algo = await repo.createAlgorithm({ name: "Empty" });
      const steps = await repo.getStepsForAlgorithm(algo.id);
      expect(steps).toEqual([]);
    });
  });
});
