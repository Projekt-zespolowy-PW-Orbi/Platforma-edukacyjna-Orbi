import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { nanoid } from "nanoid";
import type { IEnginePort } from "../domain/ports/engine.port.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "orbi-engine.exe" : "orbi-engine";
const enginePath = resolve(__dirname, "../../../packages/engine/build", binaryName);

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

export class EngineAdapter implements IEnginePort {
  private child: ChildProcess | null = null;
  private pending = new Map<string, PendingRequest>();

  private ensureRunning(): ChildProcess {
    if (this.child && this.child.exitCode === null) return this.child;

    this.child = spawn(enginePath, { stdio: ["pipe", "pipe", "pipe"] });

    const stdout = this.child.stdout;
    if (!stdout) throw new Error("engine stdout not available");
    const rl = createInterface({ input: stdout });
    rl.on("line", (line: string) => {
      try {
        const msg = JSON.parse(line);
        const req = this.pending.get(msg.id);
        if (!req) return;
        this.pending.delete(msg.id);

        if (msg.ok) {
          req.resolve(msg);
        } else {
          req.reject(new Error(msg.error ?? "engine error"));
        }
      } catch {
        // ignore malformed output
      }
    });

    this.child.on("exit", () => {
      for (const [, req] of this.pending) {
        req.reject(new Error("engine process exited"));
      }
      this.pending.clear();
      this.child = null;
    });

    return this.child;
  }

  call(op: string, x: number): Promise<{ result: number }> {
    return new Promise((resolve, reject) => {
      const proc = this.ensureRunning();
      const id = nanoid();

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      const stdin = proc.stdin;
      if (!stdin) {
        this.pending.delete(id);
        reject(new Error("engine stdin not available"));
        return;
      }

      const msg = JSON.stringify({ id, op, x }) + "\n";
      stdin.write(msg, (err) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  shutdown(): void {
    if (this.child) {
      this.child.stdin?.end();
      this.child = null;
    }
  }
}
