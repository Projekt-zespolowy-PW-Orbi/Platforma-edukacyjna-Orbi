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
  | {
      kind: "nestedFraction";
      fractionCount: number;
      requiredTokens?: string[];
    }
  | { kind: "variable"; name: string; coefficient?: number }
  | { kind: "exponential"; base: string; power: number }
  | { kind: "sum"; requiredTokens: string[] }
  | { kind: "product"; requiredTokens: string[] }
  | { kind: "raw"; contains: string[]; notContains?: string[] };

function extractNumericFractionPairs(result: string): Array<{
  numerator: number;
  denominator: number;
}> {
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
  const expectedLabel = expected.kind === "number"
    ? String(expected.value)
    : expected.kind === "fraction"
      ? `${String(expected.numerator)}/${String(expected.denominator)}`
      : expected.kind;
  console.log(`[engine-test] expected: ${expectedLabel}, actual: ${result}`);

  if (expected.kind === "number") {
    const numericResult = Number(result);
    expect(Number.isNaN(numericResult)).toBe(false);
    expect(numericResult).toBe(expected.value);
    return;
  }

  if (expected.kind === "fraction") {
    const pair = extractSingleFractionPair(result);
    expect(pair).not.toBeNull();
    expect(pair?.numerator).toBe(expected.numerator);
    expect(pair?.denominator).toBe(expected.denominator);
    return;
  }

  if (expected.kind === "fractionShape") {
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

  if (expected.kind === "variable") {
    const extracted = extractVariable(result);
    expect(extracted).not.toBeNull();
    expect(extracted?.name).toBe(expected.name);
    if (expected.coefficient !== undefined) {
      expect(extracted?.coefficient).toBe(expected.coefficient);
    }
    return;
  }

  if (expected.kind === "exponential") {
    expect(result).toContain("\"math::Exponential\":");
    expect(result).toContain(expected.base);
    expect(result).toContain(String(expected.power));
    return;
  }

  if (expected.kind === "sum") {
    expect(result).toContain("\"math::Sum\":");
    for (const token of expected.requiredTokens) {
      expect(result).toContain(token);
    }
    return;
  }

  if (expected.kind === "product") {
    expect(result).toContain("\"math::Product\":");
    for (const token of expected.requiredTokens) {
      expect(result).toContain(token);
    }
    return;
  }

  if (expected.kind === "raw") {
    for (const token of expected.contains) {
      expect(result).toContain(token);
    }
    for (const token of expected.notContains ?? []) {
      expect(result).not.toContain(token);
    }
    return;
  }

  const fractionMatches = result.match(/"math::Fraction":/g) ?? [];
  expect(fractionMatches).toHaveLength(expected.fractionCount);
  for (const token of expected.requiredTokens ?? []) {
    expect(result).toContain(token);
  }
}

function extractVariable(result: string): { name: string; coefficient: number } | null {
  // Match patterns like "2x," or "x," or "-x," or "-2x,"
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

export function expectResultToMatchVariable(
  response: EngineResponse,
  expectedName: string,
  expectedCoefficient: number = 1,
): void {
  expect(response.ok).toBe(true);
  expect(typeof response.result).toBe("string");
  const result = response.result as string;
  const extracted = extractVariable(result);
  expect(extracted).not.toBeNull();
  expect(extracted?.name).toBe(expectedName);
  expect(extracted?.coefficient).toBe(expectedCoefficient);
}

export function expectResultToContain(
  response: EngineResponse,
  requiredTokens: string[],
  forbiddenTokens: string[] = [],
): void {
  expect(response.ok).toBe(true);
  expect(typeof response.result).toBe("string");
  const result = response.result as string;
  for (const token of requiredTokens) {
    expect(result).toContain(token);
  }
  for (const token of forbiddenTokens) {
    expect(result).not.toContain(token);
  }
}
