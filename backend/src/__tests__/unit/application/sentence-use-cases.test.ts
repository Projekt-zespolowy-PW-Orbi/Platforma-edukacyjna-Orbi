import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSentenceUseCase } from "application/use-cases/sentence/create-sentence.use-case.js";
import { GetSentenceUseCase } from "application/use-cases/sentence/get-sentence.use-case.js";
import { UpdateSentenceUseCase } from "application/use-cases/sentence/update-sentence.use-case.js";
import { DeleteSentenceUseCase } from "application/use-cases/sentence/delete-sentence.use-case.js";
import { ListSentencesUseCase } from "application/use-cases/sentence/list-sentences.use-case.js";
import { LinkSentenceConceptUseCase } from "application/use-cases/sentence/link-sentence-concept.use-case.js";
import { UnlinkSentenceConceptUseCase } from "application/use-cases/sentence/unlink-sentence-concept.use-case.js";
import type { SentenceRepositoryPort } from "domain/ports/repositories/sentence.repository.port.js";
import type { Sentence, PaginatedResult } from "domain/types.js";

const now = new Date();
const sentence: Sentence = { id: 1, content: "2+2=4", createdAt: now, updatedAt: now };

function mockRepo(): { [K in keyof SentenceRepositoryPort]: ReturnType<typeof vi.fn> } {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    linkConcept: vi.fn(),
    unlinkConcept: vi.fn(),
    getConceptsForSentence: vi.fn(),
    getSentencesForConcept: vi.fn(),
  };
}

let repo: ReturnType<typeof mockRepo>;

beforeEach(() => {
  repo = mockRepo();
});

describe("Sentence Use Cases", () => {
  describe("CreateSentenceUseCase", () => {
    it("delegates to repo.create", async () => {
      repo.create.mockResolvedValue(sentence);
      const uc = new CreateSentenceUseCase(repo);

      const result = await uc.execute({ content: "2+2=4" });

      expect(repo.create).toHaveBeenCalledWith({ content: "2+2=4" });
      expect(result).toEqual(sentence);
    });

    it("propagates repository errors", async () => {
      repo.create.mockRejectedValue(new Error("fail"));
      const uc = new CreateSentenceUseCase(repo);

      await expect(uc.execute({ content: "X" })).rejects.toThrow("fail");
    });
  });

  describe("GetSentenceUseCase", () => {
    it("delegates to repo.findById", async () => {
      repo.findById.mockResolvedValue(sentence);
      const uc = new GetSentenceUseCase(repo);

      expect(await uc.execute(1)).toEqual(sentence);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it("returns null when not found", async () => {
      repo.findById.mockResolvedValue(null);
      const uc = new GetSentenceUseCase(repo);

      expect(await uc.execute(999)).toBeNull();
    });
  });

  describe("UpdateSentenceUseCase", () => {
    it("delegates to repo.update", async () => {
      const updated = { ...sentence, content: "New" };
      repo.update.mockResolvedValue(updated);
      const uc = new UpdateSentenceUseCase(repo);

      const result = await uc.execute(1, { content: "New" });

      expect(repo.update).toHaveBeenCalledWith(1, { content: "New" });
      expect(result).toEqual(updated);
    });

    it("returns null when not found", async () => {
      repo.update.mockResolvedValue(null);
      const uc = new UpdateSentenceUseCase(repo);

      expect(await uc.execute(999, { content: "X" })).toBeNull();
    });
  });

  describe("DeleteSentenceUseCase", () => {
    it("delegates to repo.delete", async () => {
      repo.delete.mockResolvedValue(true);
      const uc = new DeleteSentenceUseCase(repo);

      expect(await uc.execute(1)).toBe(true);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("returns false when not found", async () => {
      repo.delete.mockResolvedValue(false);
      const uc = new DeleteSentenceUseCase(repo);

      expect(await uc.execute(999)).toBe(false);
    });
  });

  describe("ListSentencesUseCase", () => {
    it("delegates to repo.findAll with params", async () => {
      const page: PaginatedResult<Sentence> = {
        data: [sentence], total: 1, page: 1, limit: 10, totalPages: 1,
      };
      repo.findAll.mockResolvedValue(page);
      const uc = new ListSentencesUseCase(repo);

      const result = await uc.execute({ page: 1, limit: 10 });

      expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result).toEqual(page);
    });

    it("works without params", async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      const uc = new ListSentencesUseCase(repo);

      await uc.execute();

      expect(repo.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe("LinkSentenceConceptUseCase", () => {
    it("delegates to repo.linkConcept with all three params", async () => {
      const link = { sentenceId: 1, conceptId: 2, isTrue: false };
      repo.linkConcept.mockResolvedValue(link);
      const uc = new LinkSentenceConceptUseCase(repo);

      const result = await uc.execute(1, 2, false);

      expect(repo.linkConcept).toHaveBeenCalledWith(1, 2, false);
      expect(result).toEqual(link);
    });

    it("passes isTrue=true correctly", async () => {
      repo.linkConcept.mockResolvedValue({ sentenceId: 1, conceptId: 2, isTrue: true });
      const uc = new LinkSentenceConceptUseCase(repo);

      await uc.execute(1, 2, true);

      expect(repo.linkConcept).toHaveBeenCalledWith(1, 2, true);
    });

    it("propagates duplicate link errors", async () => {
      repo.linkConcept.mockRejectedValue(new Error("duplicate"));
      const uc = new LinkSentenceConceptUseCase(repo);

      await expect(uc.execute(1, 2, true)).rejects.toThrow("duplicate");
    });
  });

  describe("UnlinkSentenceConceptUseCase", () => {
    it("delegates to repo.unlinkConcept", async () => {
      repo.unlinkConcept.mockResolvedValue(true);
      const uc = new UnlinkSentenceConceptUseCase(repo);

      expect(await uc.execute(1, 2)).toBe(true);
      expect(repo.unlinkConcept).toHaveBeenCalledWith(1, 2);
    });

    it("returns false when link does not exist", async () => {
      repo.unlinkConcept.mockResolvedValue(false);
      const uc = new UnlinkSentenceConceptUseCase(repo);

      expect(await uc.execute(99, 98)).toBe(false);
    });
  });
});
