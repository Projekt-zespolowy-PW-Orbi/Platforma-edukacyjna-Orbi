export interface IEnginePort {
  call(op: string, x: string): Promise<{ result: string }>;
  shutdown(): void;
}
