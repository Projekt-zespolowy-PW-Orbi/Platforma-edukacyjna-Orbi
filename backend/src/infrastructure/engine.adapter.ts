import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import type { IEnginePort } from "domain/ports/engine.port.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "orbi-engine.exe" : "orbi-engine";
const enginePath = resolve(__dirname, "../../../packages/engine/build", binaryName);

const MAX_RETRIES = parseInt(process.env.ENGINE_MAX_RETRIES ?? "3", 10);

interface EngineResponse {
  id: string;
  ok?: boolean;
  result?: number;
  error?: string;
}

export class EngineAdapter implements IEnginePort {
  private async spawnAndExecute(id: string, op: string, x: number): Promise<EngineResponse> {
    return new Promise((resolve, reject) => {
      const proc: ChildProcess = spawn(enginePath, { stdio: ["pipe", "pipe", "pipe"] });

      let stdoutData = "";
      let stderrData = "";
      let settled = false;

      const cleanup = () => {
        if (!proc.killed) {
          proc.kill();
        }
      };

      // stdio is explicitly set to "pipe", so these are guaranteed to exist
      const stdout = proc.stdout;
      const stderr = proc.stderr;
      const stdin = proc.stdin;

      if (!stdout || !stderr || !stdin) {
        cleanup();
        reject(new Error("Failed to create stdio streams"));
        return;
      }

      stdout.on("data", (data: Buffer) => {
        stdoutData += data.toString();
      });

      stderr.on("data", (data: Buffer) => {
        stderrData += data.toString();
      });

      proc.on("error", (err: Error) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      });

      proc.on("close", (code: number | null) => {
        if (settled) return;
        settled = true;
        cleanup();

        if (code !== 0) {
          const exitCode = code ?? -1;
          reject(new Error(`Engine exited with code ${String(exitCode)}: ${stderrData.trim()}`));
          return;
        }

        // Parse stdout lines and find the one with matching ID
        const lines = stdoutData.split("\n");
        for (const line of lines) {
          if (line.trim().length === 0) continue;
          try {
            const msg = JSON.parse(line) as EngineResponse;
            if (msg.id === id) {
              resolve(msg);
              return;
            }
          } catch {
            // Skip non-JSON lines (random console logs)
          }
        }

        reject(new Error(`No response with matching id found. stdout: ${stdoutData}`));
      });

      // Send the request
      const msg = JSON.stringify({ id, op, x }) + "\n";
      stdin.write(msg, (err) => {
        if (err) {
          if (!settled) {
            settled = true;
            cleanup();
            reject(err);
          }
        }
        stdin.end();
      });
    });
  }

  async call(op: string, x: number): Promise<{ result: number }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const id = nanoid();

      try {
        const response = await this.spawnAndExecute(id, op, x);

        if (response.ok && response.result !== undefined) {
          return { result: response.result };
        } else {
          throw new Error(response.error ?? "engine error");
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          // Retry on failure
          continue;
        }
      }
    }

    throw lastError ?? new Error("Engine call failed after retries");
  }

  shutdown(): void {
    // No persistent process to shutdown - each call spawns a short-lived process
  }
}
