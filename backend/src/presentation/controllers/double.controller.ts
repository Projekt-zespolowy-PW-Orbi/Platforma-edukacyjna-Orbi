import type { Request, Response } from "express";
import type { DoubleUseCase } from "application/use-cases/double.use-case.js";

interface DoubleRequestBody {
  x: number;
}

export class DoubleController {
  constructor(private readonly useCase: DoubleUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as DoubleRequestBody;
      const { result } = await this.useCase.execute(body.x);
      res.json({ result });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
