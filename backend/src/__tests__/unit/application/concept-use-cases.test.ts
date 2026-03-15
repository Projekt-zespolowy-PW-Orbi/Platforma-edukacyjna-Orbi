import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateConceptUseCase } from "application/use-cases/concept/create-concept.use-case.js";
import { GetConceptUseCase } from "application/use-cases/concept/get-concept.use-case.js";
import { UpdateConceptUseCase } from "application/use-cases/concept/update-concept.use-case.js";
import { DeleteConceptUseCase } from "application/use-cases/concept/delete-concept.use-case.js";
import { ListConceptsUseCase } from "application/use-cases/concept/list-concepts.use-case.js";
import { AddChildConceptUseCase } from "application/use-cases/concept/add-child-concept.use-case.js";
import { RemoveChildConceptUseCase } from "application/use-cases/concept/remove-child-concept.use-case.js";
import type { ConceptRepositoryPort } from "domain/ports/repositories/concept.repository.port.js";
import type { Concept, PaginatedResult } from "domain/types.js";

const now = new Date();
const concept: Concept = { id: 1, name: "Algebra", createdAt: now, updatedAt: now };

function mockRepo(): { [K in keyof ConceptRepositoryPort]: ReturnType<typeof vi.fn> } {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addChild: vi.fn(),
    removeChild: vi.fn(),
    getChildren: vi.fn(),
    getParents: vi.fn(),
  };
}

let repo: ReturnType<typeof mockRepo>;

beforeEach(() => {
  repo = mockRepo();
});

describe("Concept Use Cases", () => {
  describe("CreateConceptUseCase", () => {
    it("delegates to repo.create with the DTO", async () => {
      repo.create.mockResolvedValue(concept);
      const uc = new CreateConceptUseCase(repo);

      const result = await uc.execute({ name: "Algebra" });

      expect(repo.create).toHaveBeenCalledWith({ name: "Algebra" });
      expect(result).toEqual(concept);
    });

    it("propagates repository errors", async () => {
      repo.create.mockRejectedValue(new Error("duplicate"));
      const uc = new CreateConceptUseCase(repo);

      await expect(uc.execute({ name: "Dup" })).rejects.toThrow("duplicate");
    });
  });

  describe("GetConceptUseCase", () => {
    it("delegates to repo.findById", async () => {
      repo.findById.mockResolvedValue(concept);
      const uc = new GetConceptUseCase(repo);

      const result = await uc.execute(1);

      expect(repo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(concept);
    });

    it("returns null when not found", async () => {
      repo.findById.mockResolvedValue(null);
      const uc = new GetConceptUseCase(repo);

      expect(await uc.execute(999)).toBeNull();
    });
  });

  describe("UpdateConceptUseCase", () => {
    it("delegates to repo.update with id and DTO", async () => {
      const updated = { ...concept, name: "New" };
      repo.update.mockResolvedValue(updated);
      const uc = new UpdateConceptUseCase(repo);

      const result = await uc.execute(1, { name: "New" });

      expect(repo.update).toHaveBeenCalledWith(1, { name: "New" });
      expect(result).toEqual(updated);
    });

    it("returns null when concept does not exist", async () => {
      repo.update.mockResolvedValue(null);
      const uc = new UpdateConceptUseCase(repo);

      expect(await uc.execute(999, { name: "X" })).toBeNull();
    });
  });

  describe("DeleteConceptUseCase", () => {
    it("delegates to repo.delete and returns true", async () => {
      repo.delete.mockResolvedValue(true);
      const uc = new DeleteConceptUseCase(repo);

      expect(await uc.execute(1)).toBe(true);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("returns false when concept does not exist", async () => {
      repo.delete.mockResolvedValue(false);
      const uc = new DeleteConceptUseCase(repo);

      expect(await uc.execute(999)).toBe(false);
    });
  });

  describe("ListConceptsUseCase", () => {
    it("delegates to repo.findAll with pagination params", async () => {
      const page: PaginatedResult<Concept> = {
        data: [concept], total: 1, page: 2, limit: 5, totalPages: 1,
      };
      repo.findAll.mockResolvedValue(page);
      const uc = new ListConceptsUseCase(repo);

      const result = await uc.execute({ page: 2, limit: 5 });

      expect(repo.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
      expect(result).toEqual(page);
    });

    it("works without pagination params", async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      const uc = new ListConceptsUseCase(repo);

      await uc.execute();

      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe("AddChildConceptUseCase", () => {
    it("delegates to repo.addChild with parent and child ids", async () => {
      const group = { parentConceptId: 1, childConceptId: 2 };
      repo.addChild.mockResolvedValue(group);
      const uc = new AddChildConceptUseCase(repo);

      const result = await uc.execute(1, 2);

      expect(repo.addChild).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(group);
    });

    it("propagates errors (e.g. self-reference)", async () => {
      repo.addChild.mockRejectedValue(new Error("self-ref"));
      const uc = new AddChildConceptUseCase(repo);

      await expect(uc.execute(1, 1)).rejects.toThrow("self-ref");
    });
  });

  describe("RemoveChildConceptUseCase", () => {
    it("delegates to repo.removeChild", async () => {
      repo.removeChild.mockResolvedValue(true);
      const uc = new RemoveChildConceptUseCase(repo);

      expect(await uc.execute(1, 2)).toBe(true);
      expect(repo.removeChild).toHaveBeenCalledWith(1, 2);
    });

    it("returns false when relationship does not exist", async () => {
      repo.removeChild.mockResolvedValue(false);
      const uc = new RemoveChildConceptUseCase(repo);

      expect(await uc.execute(99, 98)).toBe(false);
    });
  });
});
