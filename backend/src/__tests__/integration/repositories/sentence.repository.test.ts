import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { setupTestDb, cleanTables, teardownTestDb } from "../../helpers/db.js";
import { SentenceRepository } from "infrastructure/repositories/sentence.repository.js";
import { ConceptRepository } from "infrastructure/repositories/concept.repository.js";

let sentenceRepo: SentenceRepository;
let conceptRepo: ConceptRepository;

beforeAll(async () => {
  const db = await setupTestDb();
  sentenceRepo = new SentenceRepository(db);
  conceptRepo = new ConceptRepository(db);
});

beforeEach(async () => {
  await cleanTables();
});

afterAll(async () => {
  await teardownTestDb();
});

describe("SentenceRepository", () => {
  describe("create", () => {
    it("creates a sentence and returns it with an id", async () => {
      const sentence = await sentenceRepo.create({ content: "2 + 2 = 4" });

      expect(sentence.id).toBeGreaterThan(0);
      expect(sentence.content).toBe("2 + 2 = 4");
    });
  });

  describe("findById", () => {
    it("returns the sentence when it exists", async () => {
      const created = await sentenceRepo.create({ content: "Pi is irrational" });
      const found = await sentenceRepo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.content).toBe("Pi is irrational");
    });

    it("returns null for non-existent id", async () => {
      expect(await sentenceRepo.findById(99999)).toBeNull();
    });
  });

  describe("findAll (pagination)", () => {
    it("paginates correctly", async () => {
      for (let i = 1; i <= 12; i++) {
        await sentenceRepo.create({ content: `Sentence ${String(i)}` });
      }

      const page1 = await sentenceRepo.findAll({ page: 1, limit: 5 });
      expect(page1.data).toHaveLength(5);
      expect(page1.total).toBe(12);
      expect(page1.totalPages).toBe(3);

      const page3 = await sentenceRepo.findAll({ page: 3, limit: 5 });
      expect(page3.data).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("updates sentence content", async () => {
      const created = await sentenceRepo.create({ content: "Old content" });
      const updated = await sentenceRepo.update(created.id, { content: "New content" });

      expect(updated!.content).toBe("New content");

      const found = await sentenceRepo.findById(created.id);
      expect(found!.content).toBe("New content");
    });

    it("returns null for non-existent sentence", async () => {
      expect(await sentenceRepo.update(99999, { content: "X" })).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes and returns true", async () => {
      const created = await sentenceRepo.create({ content: "Delete me" });
      expect(await sentenceRepo.delete(created.id)).toBe(true);
      expect(await sentenceRepo.findById(created.id)).toBeNull();
    });

    it("returns false for non-existent", async () => {
      expect(await sentenceRepo.delete(99999)).toBe(false);
    });
  });

  describe("sentence-concept linking", () => {
    it("links a sentence to a concept with isTrue=true", async () => {
      const concept = await conceptRepo.create({ name: "Algebra" });
      const sentence = await sentenceRepo.create({ content: "x + 1 = 2 means x = 1" });

      const link = await sentenceRepo.linkConcept(sentence.id, concept.id, true);
      expect(link.sentenceId).toBe(sentence.id);
      expect(link.conceptId).toBe(concept.id);
      expect(link.isTrue).toBe(true);
    });

    it("links a sentence to a concept with isTrue=false (false statement)", async () => {
      const concept = await conceptRepo.create({ name: "Geometry" });
      const sentence = await sentenceRepo.create({ content: "A triangle has 4 sides" });

      const link = await sentenceRepo.linkConcept(sentence.id, concept.id, false);
      expect(link.isTrue).toBe(false);
    });

    it("retrieves all concepts linked to a sentence", async () => {
      const c1 = await conceptRepo.create({ name: "Algebra" });
      const c2 = await conceptRepo.create({ name: "Arithmetic" });
      const sentence = await sentenceRepo.create({ content: "2x = 4" });

      await sentenceRepo.linkConcept(sentence.id, c1.id, true);
      await sentenceRepo.linkConcept(sentence.id, c2.id, true);

      const concepts = await sentenceRepo.getConceptsForSentence(sentence.id);
      expect(concepts).toHaveLength(2);
      const conceptIds = concepts.map((c) => c.conceptId).sort();
      expect(conceptIds).toEqual([c1.id, c2.id].sort());
    });

    it("retrieves all sentences linked to a concept", async () => {
      const concept = await conceptRepo.create({ name: "Algebra" });
      const s1 = await sentenceRepo.create({ content: "x = 1" });
      const s2 = await sentenceRepo.create({ content: "y = 2" });

      await sentenceRepo.linkConcept(s1.id, concept.id, true);
      await sentenceRepo.linkConcept(s2.id, concept.id, false);

      const sentences = await sentenceRepo.getSentencesForConcept(concept.id);
      expect(sentences).toHaveLength(2);

      const trueSentence = sentences.find((s) => s.sentenceId === s1.id);
      const falseSentence = sentences.find((s) => s.sentenceId === s2.id);
      // MySQL returns boolean columns as 1/0
      expect(trueSentence!.isTrue).toBeTruthy();
      expect(falseSentence!.isTrue).toBeFalsy();
    });

    it("unlinks a concept from a sentence", async () => {
      const concept = await conceptRepo.create({ name: "Test" });
      const sentence = await sentenceRepo.create({ content: "Test sentence" });
      await sentenceRepo.linkConcept(sentence.id, concept.id, true);

      const removed = await sentenceRepo.unlinkConcept(sentence.id, concept.id);
      expect(removed).toBe(true);

      const concepts = await sentenceRepo.getConceptsForSentence(sentence.id);
      expect(concepts).toHaveLength(0);
    });

    it("returns false when unlinking non-existent relationship", async () => {
      expect(await sentenceRepo.unlinkConcept(99999, 99998)).toBe(false);
    });

    it("rejects duplicate sentence-concept link", async () => {
      const concept = await conceptRepo.create({ name: "Math" });
      const sentence = await sentenceRepo.create({ content: "1+1=2" });
      await sentenceRepo.linkConcept(sentence.id, concept.id, true);

      await expect(
        sentenceRepo.linkConcept(sentence.id, concept.id, false)
      ).rejects.toThrow();
    });

    it("cascades - deleting sentence removes its concept links", async () => {
      const concept = await conceptRepo.create({ name: "Physics" });
      const sentence = await sentenceRepo.create({ content: "F=ma" });
      await sentenceRepo.linkConcept(sentence.id, concept.id, true);

      await sentenceRepo.delete(sentence.id);

      const sentences = await sentenceRepo.getSentencesForConcept(concept.id);
      expect(sentences).toHaveLength(0);
    });

    it("cascades - deleting concept removes its sentence links", async () => {
      const concept = await conceptRepo.create({ name: "Chemistry" });
      const sentence = await sentenceRepo.create({ content: "H2O is water" });
      await sentenceRepo.linkConcept(sentence.id, concept.id, true);

      await conceptRepo.delete(concept.id);

      const concepts = await sentenceRepo.getConceptsForSentence(sentence.id);
      expect(concepts).toHaveLength(0);
    });
  });
});
