import { describe, it, expect } from "vitest";
import { expectResultToMatch, sendRequest, type ExpectedSimplifyResult } from "./helpers/engine-test-utils.js";

type SimplifyCase = {
  name: string;
  input: string;
  expected: ExpectedSimplifyResult;
  skip?: boolean;
};

type SimplifySuite = {
  name: string;
  idPrefix: string;
  cases: SimplifyCase[];
};

function runSimplifyCaseGroup(
  idPrefix: string,
  cases: SimplifyCase[],
): void {
  for (const [index, testCase] of cases.entries()) {
    const runner = testCase.skip ? it.skip : it;
    runner(testCase.name, async () => {
      const id = `${idPrefix}-${index + 1}`;
      const res = await sendRequest({ id, op: "simplify", x: testCase.input });
      expect(res.id).toBe(id);
      expectResultToMatch(res, testCase.expected);
    });
  }
}

describe("orbi-engine simplify", () => {
  const simplifySuites: SimplifySuite[] = [
    {
      name: "base arithmetic",
      idPrefix: "base",
      cases: [
        { name: "simple sum result", input: "5 + 5 + 5 + 5", expected: { kind: "number", value: 20 } },
        { name: "simple product result", input: "1 * 2 * 3 * 4", expected: { kind: "number", value: 24 } },
        { name: "respects operator precedence", input: "2 + 3 * 4", expected: { kind: "number", value: 14 } },
        { name: "respects parentheses", input: "(2 + 3) * 4", expected: { kind: "number", value: 20 } },
        { name: "handles subtraction", input: "10 - 3", expected: { kind: "number", value: 7 } },
        { name: "handles mixed addition and subtraction", input: "10 + 5 - 3", expected: { kind: "number", value: 12 } },
        { name: "sums to zero", input: "5 - 5", expected: { kind: "number", value: 0 } },
        { name: "large integer computation", input: "100 * 100", expected: { kind: "number", value: 10000 } },
      ],
    },
    {
      name: "operator precedence numeric",
      idPrefix: "prec",
      cases: [
        { name: "addition vs multiplication: left", input: "1 + 2 * 3", expected: { kind: "number", value: 7 } },
        { name: "addition vs multiplication: right", input: "2 * 3 + 1", expected: { kind: "number", value: 7 } },
        { name: "subtraction vs multiplication", input: "10 - 2 * 3", expected: { kind: "number", value: 4 } },
        { name: "chained operations", input: "2 + 3 * 4 - 5", expected: { kind: "number", value: 9 } },
        { name: "parentheses override precedence", input: "(2 + 3) * (4 - 1)", expected: { kind: "number", value: 15 } },
        { name: "multiple levels of parentheses", input: "((2 + 3) * 4) - 5", expected: { kind: "number", value: 15 } },
        { name: "triple-nested parentheses evaluate correctly", input: "(((1 + 2)))", expected: { kind: "number", value: 3 } },
      ],
    },
    {
      name: "variable arithmetic (string)",
      idPrefix: "varstr",
      cases: [
        { name: "sums same variable", input: "x + x", expected: { kind: "string", value: "2x" } },
        { name: "sums multiple same variables", input: "2x + 3x", expected: { kind: "string", value: "5x" } },
        { name: "subtracts same variable", input: "3x - x", expected: { kind: "string", value: "2x" } },
        { name: "sums multiple different variables", input: "2x + 3y", expected: { kind: "string", value: "\"math::Sum\":{2x,3y}" } },
      ]
    },
    {
      name: "fraction arithmetic",
      idPrefix: "frac",
      cases: [
        { name: "sum of two fractions", input: "1/2 + 1/3", expected: { kind: "string", value: "\"math::Fraction\":{5,6}" } },
        { name: "easy fraction simplification", input: "2/4", expected: { kind: "string", value: "\"math::Fraction\":{1,2}" } },
        { name: "fraction with multiple variables in numerator", input: "2/4 + 5/10", expected: { kind: "number", value: 1 } },
      ],
    }
  ];

  for (const suite of simplifySuites) {
    describe(suite.name, () => {
      runSimplifyCaseGroup(suite.idPrefix, suite.cases);
    });
  }
});