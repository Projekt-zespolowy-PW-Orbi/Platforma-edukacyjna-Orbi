import { describe, it, expect } from "vitest";
import { expectResultToMatch, sendRequest } from "./helpers/engine-test-utils.js";

describe("orbi-engine simplify", () => {
  const baseCases = [
    { name: "simple sum result", input: "5 + 5 + 5 + 5", expected: { kind: "literal", value: "20" } },
    { name: "simple product result", input: "1 * 2 * 3 * 4", expected: { kind: "literal", value: "24" } },
    { name: "respects operator precedence", input: "2 + 3 * 4", expected: { kind: "literal", value: "14" } },
    { name: "respects parentheses", input: "(2 + 3) * 4", expected: { kind: "literal", value: "20" } },
  ] as const;

  for (const [index, testCase] of baseCases.entries()) {
    it(testCase.name, async () => {
      const id = `base-${index + 1}`;
      const res = await sendRequest({ id, op: "simplify", x: testCase.input });
      expect(res.id).toBe(id);
      expectResultToMatch(res, testCase.expected);
    });
  }
});

describe("orbi-engine fraction simplify", () => {
  const fractionCases = [
    { name: "reduces a simple fraction", input: "6/8", expected: { kind: "fraction", numerator: 3, denominator: 4 } },
    { name: "reduces zero numerator to integer zero", input: "0/5", expected: { kind: "literal", value: "0" } },
    { name: "keeps denominator one as fraction output", input: "2/1", expected: { kind: "fraction", numerator: 2, denominator: 1 } },
    { name: "normalizes negative denominator sign", input: "6/-8", expected: { kind: "fraction", numerator: -3, denominator: 4 } },
    { name: "normalizes double negatives", input: "-6/-8", expected: { kind: "fraction", numerator: 3, denominator: 4 } },
    { name: "finds common denominator with lcm for two fractions", input: "1/2 + 1/3", expected: { kind: "fraction", numerator: 5, denominator: 6 } },
    { name: "finds iterative common denominator for multiple fractions", input: "1/6 + 1/3 + 1/2", expected: { kind: "literal", value: "1" } },
    { name: "sums numerators over an equal denominator", input: "1/5 + 2/5", expected: { kind: "fraction", numerator: 3, denominator: 5 } },
    { name: "merges fraction factors in product path", input: "2/3 * 9/4", expected: { kind: "fraction", numerator: 3, denominator: 2 } },
  ] as const;

  for (const [index, testCase] of fractionCases.entries()) {
    it(testCase.name, async () => {
      const id = `frac-${index + 1}`;
      const res = await sendRequest({ id, op: "simplify", x: testCase.input });
      expect(res.id).toBe(id);
      expectResultToMatch(res, testCase.expected);
    });
  }
});
