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
  | { kind: "number"; value: number }
  | { kind: "fraction"; numerator: number; denominator: number }
  | { kind: "fractionShape"; requiredTokens: string[]; denominator?: number }
  | { kind: "nestedFraction"; fractionCount: number; requiredTokens?: string[] }
  | { kind: "variable"; name: string; coefficient?: number }
  | { kind: "exponential"; base: string; power: number }
  | { kind: "sum"; requiredTokens: string[] }
  | { kind: "product"; requiredTokens: string[] }
  | { kind: "raw"; contains: string[]; notContains?: string[] };

function extractNumericFractionPairs(result: string): Array<{ numerator: number; denominator: number }> {
  const pairs: Array<{ numerator: number; denominator: number }> = [];
  const regex = /"math::Fraction":\s*\{\s*(-?\d+),\s*(-?\d+)\s*\}/g;
  let match: RegExpExecArray | null = regex.exec(result);

  while (match !== null) {
    pairs.push({
      numerator: Number(match[1]),
      denominator: Number(match[2]),
    });
    match = regex.exec(result);
  }

  return pairs;
}

function extractSingleFractionPair(result: string): {
  numerator: number;
  denominator: number;
} | null {
  const numericMatch = result.match(
    /"math::Fraction":\s*\{\s*(-?\d+),\s*(-?\d+)\s*\}/,
  );
  if (numericMatch !== null) {
    return {
      numerator: Number(numericMatch[1]),
      denominator: Number(numericMatch[2]),
    };
  }

  const negativeProductMatch = result.match(
    /"math::Fraction":\s*\{\s*"math::Product":\s*\{\s*-1,\s*(\d+)\s*\}\s*,\s*(-?\d+)\s*\}/,
  );
  if (negativeProductMatch !== null) {
    return {
      numerator: -Number(negativeProductMatch[1]),
      denominator: Number(negativeProductMatch[2]),
    };
  }

  return null;
}

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
  const result = response.result as string;

  console.log("[engine-test] expected:", expected);
  console.log("[engine-test] result:", result);

  switch (expected.kind) {
    case "number": {
      const numericResult = Number(result);
      expect(Number.isNaN(numericResult)).toBe(false);
      expect(numericResult).toBe(expected.value);
      return;
    }
    case "fraction": {
      const pair = extractSingleFractionPair(result);
      expect(pair).not.toBeNull();
      expect(pair?.numerator).toBe(expected.numerator);
      expect(pair?.denominator).toBe(expected.denominator);
      return;
    }
    case "fractionShape": {
      expect(result).toContain("\"math::Fraction\":");
      for (const token of expected.requiredTokens) {
        expect(result).toContain(token);
      }
      if (expected.denominator !== undefined) {
        const pairs = extractNumericFractionPairs(result);
        const hasExpectedDenominator = pairs.some(
          (pair) => pair.denominator === expected.denominator,
        );
        expect(hasExpectedDenominator).toBe(true);
      }
      return;
    }
    case "nestedFraction": {
      const fractionMatches = result.match(/"math::Fraction":/g) ?? [];
      expect(fractionMatches).toHaveLength(expected.fractionCount);
      for (const token of expected.requiredTokens ?? []) {
        expect(result).toContain(token);
      }
      return;
    }
    case "variable": {
      const extracted = extractVariable(result);
      expect(extracted).not.toBeNull();
      expect(extracted?.name).toBe(expected.name);
      if (expected.coefficient !== undefined) {
        expect(extracted?.coefficient).toBe(expected.coefficient);
      }
      return;
    }
    case "exponential": {
      expect(result).toContain("\"math::Exponential\":");
      expect(result).toContain(expected.base);
      expect(result).toContain(String(expected.power));
      return;
    }
    case "sum": {
      expect(result).toContain("\"math::Sum\":");
      for (const token of expected.requiredTokens) {
        expect(result).toContain(token);
      }
      return;
    }
    case "product": {
      expect(result).toContain("\"math::Product\":");
      for (const token of expected.requiredTokens) {
        expect(result).toContain(token);
      }
      return;
    }
    case "raw": {
      for (const token of expected.contains) {
        expect(result).toContain(token);
      }
      for (const token of expected.notContains ?? []) {
        expect(result).not.toContain(token);
      }
      return;
    }
    default: {
      const _exhaustive: never = expected;
      throw new Error(`Unhandled expected kind: ${(_exhaustive as ExpectedSimplifyResult).kind}`);
    }
  }
}

function extractVariable(result: string): { name: string; coefficient: number } | null {
  const match = result.match(/^\s*(-?\d*)([a-zA-Z]+),?\s*$/m);
  if (match !== null) {
    const coefStr = match[1];
    const name = match[2];
    let coefficient = 1;
    if (coefStr === "-") coefficient = -1;
    else if (coefStr !== "") coefficient = Number(coefStr);
    return { name, coefficient };
  }
  return null;
}
