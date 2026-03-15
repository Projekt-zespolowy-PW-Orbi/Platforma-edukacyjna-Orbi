import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { setupTestDb, cleanTables, teardownTestDb } from "__tests__/helpers/db.js";
import { ConceptRepository } from "infrastructure/repositories/concept.repository.js";

let repo: ConceptRepository;

beforeAll(async () => {
  const db = await setupTestDb();
  repo = new ConceptRepository(db);
});

beforeEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("ConceptRepository", () => {
  describe("create", () => {
    it("creates a concept and returns it with an id", async () => {
      const concept = await repo.create({ name: "Algebra" });

      expect(concept.id).toBeGreaterThan(0);
      expect(concept.name).toBe("Algebra");
    });

    it("rejects duplicate concept names (unique constraint)", async () => {
      await repo.create({ name: "Algebra" });

      await expect(repo.create({ name: "Algebra" })).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("returns the concept when it exists", async () => {
      const created = await repo.create({ name: "Geometry" });
      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("Geometry");
    });

    it("returns null for non-existent id", async () => {
      const found = await repo.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe("findAll (pagination)", () => {
    it("returns paginated results with correct metadata", async () => {
      for (let i = 1; i <= 15; i++) {
        await repo.create({ name: `Concept ${String(i).padStart(2, "0")}` });
      }

      const page1 = await repo.findAll({ page: 1, limit: 5 });
      expect(page1.data).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(5);
      expect(page1.totalPages).toBe(3);

      const page3 = await repo.findAll({ page: 3, limit: 5 });
      expect(page3.data).toHaveLength(5);
      expect(page3.page).toBe(3);
    });

    it("defaults to page 1, limit 10", async () => {
      for (let i = 1; i <= 3; i++) {
        await repo.create({ name: `C${String(i)}` });
      }

      const result = await repo.findAll();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.data).toHaveLength(3);
    });

    it("returns empty data for page beyond total", async () => {
      await repo.create({ name: "Only one" });

      const result = await repo.findAll({ page: 5, limit: 10 });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(1);
    });
  });

  describe("update", () => {
    it("updates the concept name", async () => {
      const created = await repo.create({ name: "Old Name" });
      const updated = await repo.update(created.id, { name: "New Name" });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("New Name");

      // Verify persisted
      const found = await repo.findById(created.id);
      expect(found!.name).toBe("New Name");
    });

    it("returns null when updating non-existent concept", async () => {
      const result = await repo.update(99999, { name: "Ghost" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing concept and returns true", async () => {
      const created = await repo.create({ name: "ToDelete" });
      const deleted = await repo.delete(created.id);

      expect(deleted).toBe(true);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });

    it("returns false when deleting non-existent concept", async () => {
      const deleted = await repo.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe("parent-child relationships", () => {
    it("adds a child concept and retrieves it", async () => {
      const parent = await repo.create({ name: "Mathematics" });
      const child = await repo.create({ name: "Algebra" });

      const group = await repo.addChild(parent.id, child.id);
      expect(group.parentConceptId).toBe(parent.id);
      expect(group.childConceptId).toBe(child.id);

      const children = await repo.getChildren(parent.id);
      expect(children).toHaveLength(1);
      expect(children[0]!.name).toBe("Algebra");
    });

    it("retrieves parents of a child concept", async () => {
      const parent1 = await repo.create({ name: "Math" });
      const parent2 = await repo.create({ name: "Science" });
      const child = await repo.create({ name: "Statistics" });

      await repo.addChild(parent1.id, child.id);
      await repo.addChild(parent2.id, child.id);

      const parents = await repo.getParents(child.id);
      expect(parents).toHaveLength(2);
      const parentNames = parents.map((p) => p.name).sort();
      expect(parentNames).toEqual(["Math", "Science"]);
    });

    it("prevents self-referencing (parent === child)", async () => {
      const concept = await repo.create({ name: "Self" });

      await expect(repo.addChild(concept.id, concept.id)).rejects.toThrow();
    });

    it("removes a child relationship", async () => {
      const parent = await repo.create({ name: "Parent" });
      const child = await repo.create({ name: "Child" });
      await repo.addChild(parent.id, child.id);

      const removed = await repo.removeChild(parent.id, child.id);
      expect(removed).toBe(true);

      const children = await repo.getChildren(parent.id);
      expect(children).toHaveLength(0);
    });

    it("returns false when removing non-existent relationship", async () => {
      const removed = await repo.removeChild(99999, 99998);
      expect(removed).toBe(false);
    });

    it("cascades delete - removing parent removes relationships", async () => {
      const parent = await repo.create({ name: "Parent" });
      const child = await repo.create({ name: "Child" });
      await repo.addChild(parent.id, child.id);

      await repo.delete(parent.id);

      // Child still exists, but relationship is gone
      const childFound = await repo.findById(child.id);
      expect(childFound).not.toBeNull();

      const parents = await repo.getParents(child.id);
      expect(parents).toHaveLength(0);
    });

    it("supports multiple children for one parent", async () => {
      const parent = await repo.create({ name: "Math" });
      const c1 = await repo.create({ name: "Algebra" });
      const c2 = await repo.create({ name: "Geometry" });
      const c3 = await repo.create({ name: "Calculus" });

      await repo.addChild(parent.id, c1.id);
      await repo.addChild(parent.id, c2.id);
      await repo.addChild(parent.id, c3.id);

      const children = await repo.getChildren(parent.id);
      expect(children).toHaveLength(3);
    });

    it("rejects duplicate parent-child pair", async () => {
      const parent = await repo.create({ name: "Parent" });
      const child = await repo.create({ name: "Child" });
      await repo.addChild(parent.id, child.id);

      await expect(repo.addChild(parent.id, child.id)).rejects.toThrow();
    });
  });
});
