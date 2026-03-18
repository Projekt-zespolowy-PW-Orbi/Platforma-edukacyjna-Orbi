import type { Request, Response } from "express";
import type { SimplifyUseCase } from "application/use-cases/engine/simplify.use-case.js";

interface SimplifyRequestBody {
  x: string;
}

export class SimplifyController {
  constructor(private readonly useCase: SimplifyUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as SimplifyRequestBody;
      const { result } = await this.useCase.execute(body.x);
      res.json({ result });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}