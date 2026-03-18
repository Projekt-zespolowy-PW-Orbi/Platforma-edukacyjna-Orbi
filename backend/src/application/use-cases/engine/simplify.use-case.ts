import type { IEnginePort } from "domain/ports/engine.port.js";

export class SimplifyUseCase {
  constructor(private engine: IEnginePort) {}

  async execute(x: string): Promise<{ result: string }> {
    return this.engine.call("simplify", x);
  }
}