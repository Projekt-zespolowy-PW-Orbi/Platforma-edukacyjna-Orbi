import type { IEnginePort } from "domain/ports/engine.port.js";

export class DoubleUseCase {
  constructor(private engine: IEnginePort) {}

  async execute(x: number): Promise<{ result: number }> {
    return this.engine.call("double", x);
  }
}
