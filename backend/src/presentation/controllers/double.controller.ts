import type { Request, Response } from "express";
import type { DoubleUseCase } from "../../application/use-cases/double.use-case.js";

export class DoubleController {
  constructor(private useCase: DoubleUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { result } = await this.useCase.execute(req.body.x);
      res.json({ result });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
