import type { Request, Response } from "express";
import type {
  CreateConceptUseCase,
  GetConceptUseCase,
  UpdateConceptUseCase,
  DeleteConceptUseCase,
  ListConceptsUseCase,
  AddChildConceptUseCase,
  RemoveChildConceptUseCase,
} from "application/use-cases/concept/index.js";

interface CreateConceptBody {
  name: string;
  description?: string;
}

interface UpdateConceptBody {
  name?: string;
  description?: string;
}

interface AddChildBody {
  childId: number;
}

export class ConceptController {
  constructor(
    private readonly createUseCase: CreateConceptUseCase,
    private readonly getUseCase: GetConceptUseCase,
    private readonly updateUseCase: UpdateConceptUseCase,
    private readonly deleteUseCase: DeleteConceptUseCase,
    private readonly listUseCase: ListConceptsUseCase,
    private readonly addChildUseCase: AddChildConceptUseCase,
    private readonly removeChildUseCase: RemoveChildConceptUseCase
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateConceptBody;
      const concept = await this.createUseCase.execute({
        name: body.name,
        description: body.description,
      });
      res.status(201).json(concept);
    } catch {
      res.status(500).json({ error: "Failed to create concept" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const concept = await this.getUseCase.execute(id);
      if (!concept) {
        res.status(404).json({ error: "Concept not found" });
        return;
      }
      res.json(concept);
    } catch {
      res.status(500).json({ error: "Failed to get concept" });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = await this.listUseCase.execute({ page, limit });
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to list concepts" });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const body = req.body as UpdateConceptBody;
      const concept = await this.updateUseCase.execute(id, {
        name: body.name,
        description: body.description,
      });
      if (!concept) {
        res.status(404).json({ error: "Concept not found" });
        return;
      }
      res.json(concept);
    } catch {
      res.status(500).json({ error: "Failed to update concept" });
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
        res.status(404).json({ error: "Concept not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete concept" });
    }
  };

  addChild = async (req: Request, res: Response): Promise<void> => {
    try {
      const parentId = Number(req.params.id);
      const body = req.body as AddChildBody;
      if (isNaN(parentId) || isNaN(body.childId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const result = await this.addChildUseCase.execute(parentId, body.childId);
      res.status(201).json(result);
    } catch {
      res.status(500).json({ error: "Failed to add child concept" });
    }
  };

  removeChild = async (req: Request, res: Response): Promise<void> => {
    try {
      const parentId = Number(req.params.id);
      const childId = Number(req.params.childId);
      if (isNaN(parentId) || isNaN(childId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const removed = await this.removeChildUseCase.execute(parentId, childId);
      if (!removed) {
        res.status(404).json({ error: "Relationship not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to remove child concept" });
    }
  };
}
