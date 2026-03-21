import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "orbi-engine.exe" : "orbi-engine";
const enginePath = resolve(__dirname, "../../../build", binaryName);

export type PaperOpKind = "paper_add" | "paper_multiply";

export type EngineResponse = {
  id: string;
  ok: boolean;
  result?: string;
  op?: PaperOpKind;
  a?: string;
  b?: string;
  digits?: number[][];
  carries?: number[][];
  error?: string;
};

export type ExpectedSimplifyResult =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string };

export type ExpectedPaperMatrix = {
  digits: number[][];
  carries: number[][];
};

const ENGINE_TIMEOUT_MS = 5_000;

export function sendRequest(input: object): Promise<EngineResponse> {
  return new Promise((resolveRequest, rejectRequest) => {
    const proc = spawn(enginePath);
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill();
        rejectRequest(new Error(`Engine timed out after ${ENGINE_TIMEOUT_MS}ms`));
      }
    }, ENGINE_TIMEOUT_MS);

    proc.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        rejectRequest(new Error(`Failed to spawn engine: ${err.message}`));
      }
    });

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    proc.on("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (stderr.trim().length > 0) {
        rejectRequest(new Error(`stderr: ${stderr}`));
        return;
      }

      const payload = stdout.trim();
      if (!payload) {
        rejectRequest(new Error("Engine returned empty stdout"));
        return;
      }

      try {
        resolveRequest(JSON.parse(payload) as EngineResponse);
      } catch {
        rejectRequest(new Error(`Failed to parse JSON: ${payload}`));
      }
    });

    proc.stdin.write(JSON.stringify(input) + "\n");
    proc.stdin.end();
  });
}

export function expectResultToMatch(
  response: EngineResponse,
  expected: ExpectedSimplifyResult,
): void {
  expect(response.ok).toBe(true);
  expect(typeof response.result).toBe("string");
  const rawResult = (response.result as string).trim();
  
  switch (expected.kind) {
    case "number": {
      const numericResult = Number(rawResult);
      expect(Number.isNaN(numericResult)).toBe(false);
      expect(numericResult).toBe(expected.value);
      return;
    }
    case "string": {
      expect(rawResult).toBe(expected.value.trim());
      return;
    }
    default: {
      const _exhaustive: never = expected;
      throw new Error(`Unhandled expected kind: ${(_exhaustive as ExpectedSimplifyResult).kind}`);
    }
  }
}

export function expectPaperMatrixToMatch(
  response: EngineResponse,
  expected: Omit<ExpectedPaperMatrix, "op">,
  expectedOp: PaperOpKind,
): void {
  expect(response.ok).toBe(true);
  expect(response.op).toBe(expectedOp);
  expect(response.digits).toEqual(expected.digits);
  expect(response.carries).toEqual(expected.carries);
}

export async function expectPaperOpToFail(
  a: string,
  b: string,
  op: PaperOpKind,
  expectedError: string,
): Promise<void> {
  const id = `${op}-err`;
  const r = await sendRequest({ id, op, a, b });
  expect(r.ok).toBe(false);
  expect(r.error).toBe(expectedError);
}
