import type { Request, Response } from "express";
import type {
  CreateAlgorithmUseCase,
  GetAlgorithmUseCase,
  UpdateAlgorithmUseCase,
  DeleteAlgorithmUseCase,
  ListAlgorithmsUseCase,
  CreateStepUseCase,
  AddStepToAlgorithmUseCase,
  RemoveStepFromAlgorithmUseCase,
  GetAlgorithmStepsUseCase,
} from "application/use-cases/algorithm/index.js";

interface CreateAlgorithmBody {
  name: string;
  description?: string;
}

interface UpdateAlgorithmBody {
  name?: string;
  description?: string;
}

interface CreateStepBody {
  content: string;
  algorithmId?: number;
}

interface AddStepBody {
  stepId: number;
  orderNumber?: number;
}

export class AlgorithmController {
  constructor(
    private readonly createUseCase: CreateAlgorithmUseCase,
    private readonly getUseCase: GetAlgorithmUseCase,
    private readonly updateUseCase: UpdateAlgorithmUseCase,
    private readonly deleteUseCase: DeleteAlgorithmUseCase,
    private readonly listUseCase: ListAlgorithmsUseCase,
    private readonly createStepUseCase: CreateStepUseCase,
    private readonly addStepUseCase: AddStepToAlgorithmUseCase,
    private readonly removeStepUseCase: RemoveStepFromAlgorithmUseCase,
    private readonly getStepsUseCase: GetAlgorithmStepsUseCase
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateAlgorithmBody;
      const algorithm = await this.createUseCase.execute({
        name: body.name,
        description: body.description,
      });
      res.status(201).json(algorithm);
    } catch {
      res.status(500).json({ error: "Failed to create algorithm" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const algorithm = await this.getUseCase.execute(id);
      if (!algorithm) {
        res.status(404).json({ error: "Algorithm not found" });
        return;
      }
      res.json(algorithm);
    } catch {
      res.status(500).json({ error: "Failed to get algorithm" });
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = await this.listUseCase.execute({ page, limit });
      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to list algorithms" });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const body = req.body as UpdateAlgorithmBody;
      const algorithm = await this.updateUseCase.execute(id, {
        name: body.name,
        description: body.description,
      });
      if (!algorithm) {
        res.status(404).json({ error: "Algorithm not found" });
        return;
      }
      res.json(algorithm);
    } catch {
      res.status(500).json({ error: "Failed to update algorithm" });
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
        res.status(404).json({ error: "Algorithm not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete algorithm" });
    }
  };

  createStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateStepBody;
      const step = await this.createStepUseCase.execute({
        content: body.content,
        algorithmId: body.algorithmId,
      });
      res.status(201).json(step);
    } catch {
      res.status(500).json({ error: "Failed to create step" });
    }
  };

  addStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const algorithmId = Number(req.params.id);
      const body = req.body as AddStepBody;
      if (isNaN(algorithmId) || isNaN(body.stepId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const result = await this.addStepUseCase.execute(
        algorithmId,
        body.stepId,
        body.orderNumber ?? 0
      );
      res.status(201).json(result);
    } catch {
      res.status(500).json({ error: "Failed to add step to algorithm" });
    }
  };

  removeStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const algorithmId = Number(req.params.id);
      const stepId = Number(req.params.stepId);
      if (isNaN(algorithmId) || isNaN(stepId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const removed = await this.removeStepUseCase.execute(algorithmId, stepId);
      if (!removed) {
        res.status(404).json({ error: "Relationship not found" });
        return;
      }
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to remove step from algorithm" });
    }
  };

  getSteps = async (req: Request, res: Response): Promise<void> => {
    try {
      const algorithmId = Number(req.params.id);
      if (isNaN(algorithmId)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
      }
      const steps = await this.getStepsUseCase.execute(algorithmId);
      res.json(steps);
    } catch {
      res.status(500).json({ error: "Failed to get algorithm steps" });
    }
  };
}
