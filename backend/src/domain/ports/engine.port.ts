export interface IEnginePort {
  call(op: string, x: number): Promise<{ result: number }>;
  shutdown(): void;
}
