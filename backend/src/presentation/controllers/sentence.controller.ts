import type { Request, Response } from "express";
import type {
  CreateSentenceUseCase,
  GetSentenceUseCase,
  UpdateSentenceUseCase,
  DeleteSentenceUseCase,
  ListSentencesUseCase,
  LinkSentenceConceptUseCase,
  UnlinkSentenceConceptUseCase,
} from "application/use-cases/sentence/index.js";

interface CreateSentenceBody {
  content: string;
}

interface UpdateSentenceBody {
  content?: string;
}

interface LinkConceptBody {
  conceptId: number;
  isTrue?: boolean;
}

export class SentenceController {
  constructor(
    private readonly createUseCase: CreateSentenceUseCase,
    private readonly getUseCase: GetSentenceUseCase,
    private readonly updateUseCase: UpdateSentenceUseCase,
    private readonly deleteUseCase: DeleteSentenceUseCase,
    private readonly listUseCase: ListSentencesUseCase,
    private readonly linkConceptUseCase: LinkSentenceConceptUseCase,
    private readonly unlinkConceptUseCase: UnlinkSentenceConceptUseCase
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateSentenceBody;
      const sentence = await this.createUseCase.execute({ content: body.content });
      res.status(201).json(sentence);
    } catch {
      res.status(500).json({ error: "Failed to create sentence" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const sentence = await this.getUseCase.execute(id);
      if (!sentence) {
        res.status(404).json({ error: "Sentence not found" });
        return;
      }
      res.json(sentence);
    } catch {
      res.status(500).json({ error: "Failed to get sentence" });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = await this.listUseCase.execute({ page, limit });
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to list sentences" });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const body = req.body as UpdateSentenceBody;
      const sentence = await this.updateUseCase.execute(id, { content: body.content });
      if (!sentence) {
        res.status(404).json({ error: "Sentence not found" });
        return;
      }
      res.json(sentence);
    } catch {
      res.status(500).json({ error: "Failed to update sentence" });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const deleted = await this.deleteUseCase.execute(id);
      if (!deleted) {
        res.status(404).json({ error: "Sentence not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete sentence" });
    }
  };

  linkConcept = async (req: Request, res: Response): Promise<void> => {
    try {
      const sentenceId = Number(req.params.id);
      const body = req.body as LinkConceptBody;
      if (isNaN(sentenceId) || isNaN(body.conceptId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const result = await this.linkConceptUseCase.execute(
        sentenceId,
        body.conceptId,
        body.isTrue ?? true
      );
      res.status(201).json(result);
    } catch {
      res.status(500).json({ error: "Failed to link concept to sentence" });
    }
  };

  unlinkConcept = async (req: Request, res: Response): Promise<void> => {
    try {
      const sentenceId = Number(req.params.id);
      const conceptId = Number(req.params.conceptId);
      if (isNaN(sentenceId) || isNaN(conceptId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const removed = await this.unlinkConceptUseCase.execute(sentenceId, conceptId);
      if (!removed) {
        res.status(404).json({ error: "Relationship not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to unlink concept from sentence" });
    }
  };
}
