import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "orbi-engine.exe" : "orbi-engine";
const enginePath = resolve(__dirname, "../../../build", binaryName);

export type EngineResponse = {
  id: string;
  ok: boolean;
  result?: string;
  error?: string;
};

export type ExpectedSimplifyResult =
  | { kind: "literal"; value: string }
  | { kind: "fraction"; numerator: number; denominator: number };

export function sendRequest(input: object): Promise<EngineResponse> {
  return new Promise((resolveRequest, rejectRequest) => {
    const proc = spawn(enginePath);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    proc.on("close", () => {
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
  const result = response.result as string;

  if (expected.kind === "literal") {
    expect(result).toBe(expected.value);
    return;
  }

  const match = result.match(/"math::Fraction":\s*\{\s*(-?\d+),\s*(-?\d+)\s*\}/);
  expect(match).not.toBeNull();
  expect(match?.[1]).toBe(String(expected.numerator));
  expect(match?.[2]).toBe(String(expected.denominator));
}
