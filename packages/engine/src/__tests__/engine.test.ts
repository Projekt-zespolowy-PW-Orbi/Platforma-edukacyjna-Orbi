import { describe, expect, it } from "vitest";
import {
  expectResultToMatch,
  sendRequest,
  type EngineResponse,
  type ExpectedSimplifyResult,
} from "./helpers/engine-test-utils.js";

type SimplifyCase = {
  name: string;
  input: string;
  expected: ExpectedSimplifyResult;
  skip?: boolean;
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
  const baseCases: SimplifyCase[] = [
    { name: "simple sum result", input: "5 + 5 + 5 + 5", expected: { kind: "number", value: 20 } },
    { name: "simple product result", input: "1 * 2 * 3 * 4", expected: { kind: "number", value: 24 } },
    { name: "respects operator precedence", input: "2 + 3 * 4", expected: { kind: "number", value: 14 } },
    { name: "respects parentheses", input: "(2 + 3) * 4", expected: { kind: "number", value: 20 } },
  ];

  runSimplifyCaseGroup("base", baseCases);
});

describe("orbi-engine fraction simplify", () => {
  const fractionCases: SimplifyCase[] = [
    { name: "reduces a simple fraction", input: "6/8", expected: { kind: "fraction", numerator: 3, denominator: 4 } },
    { name: "reduces zero numerator to integer zero", input: "0/5", expected: { kind: "number", value: 0 } },
    { name: "keeps denominator one as fraction output", input: "2/1", expected: { kind: "fraction", numerator: 2, denominator: 1 } },
    { name: "normalizes negative denominator sign", input: "6/-8", expected: { kind: "fraction", numerator: -3, denominator: 4 } },
    { name: "normalizes double negatives", input: "-6/-8", expected: { kind: "fraction", numerator: 3, denominator: 4 } },
    { name: "finds common denominator with lcm for two fractions", input: "1/2 + 1/3", expected: { kind: "fraction", numerator: 5, denominator: 6 } },
    { name: "finds iterative common denominator for multiple fractions", input: "1/6 + 1/3 + 1/2", expected: { kind: "number", value: 1 } },
    { name: "sums numerators over an equal denominator", input: "1/5 + 2/5", expected: { kind: "fraction", numerator: 3, denominator: 5 } },
    { name: "merges fraction factors in product path", input: "2/3 * 9/4", expected: { kind: "fraction", numerator: 3, denominator: 2 } },
  ];

  runSimplifyCaseGroup("frac", fractionCases);
});

describe("orbi-engine fraction common-denominator and shared-sum edges", () => {
  const denominatorCases: SimplifyCase[] = [
    { name: "scales to lcm across three denominators", input: "1/4 + 1/6 + 1/9", expected: { kind: "fraction", numerator: 19, denominator: 36 } },
    { name: "handles negative plus positive fraction", input: "-1/4 + 1/6", expected: { kind: "fraction", numerator: -1, denominator: 12 } },
    { name: "reduces after denominator scaling", input: "2/7 + 3/14", expected: { kind: "fraction", numerator: 1, denominator: 2 } },
    { name: "handles parenthesized numerator in sum", input: "(1 + 2)/3 + 1/6", expected: { kind: "fraction", numerator: 7, denominator: 6 } },
    { name: "sums shared denominators into whole number", input: "3/8 + 1/8 + 4/8", expected: { kind: "number", value: 1 } },
    { name: "[BUG] parenthesized negative numerator should sum correctly", input: "5/12 + (-2)/12", expected: { kind: "fraction", numerator: 1, denominator: 4 }, skip: true },
    {
      name: "keeps symbolic numerator structure over shared denominator",
      input: "x/5 + 2/5",
      expected: { kind: "fractionShape", requiredTokens: ["x", "5"] },
    },
  ];

  runSimplifyCaseGroup("den", denominatorCases);
});

describe("orbi-engine fraction split, mixed sums, product edges, and robustness", () => {
  const edgeCases: SimplifyCase[] = [
    { name: "reduces split-like numerator sum to number", input: "(1 + 2)/3", expected: { kind: "number", value: 1 } },
    { name: "reduces another split-like numerator sum to number", input: "(2 + 4)/6", expected: { kind: "number", value: 1 } },
    {
      name: "keeps symbolic split numerator structure stable",
      input: "(a + b)/2",
      expected: {
        kind: "fractionShape",
        requiredTokens: ["\"math::Sum\":", "a", "b", "2"],
      },
    },
    { name: "adds integer and fraction into improper fraction", input: "2 + 1/3", expected: { kind: "fraction", numerator: 7, denominator: 3 } },
    { name: "adds negative integer and fraction", input: "-2 + 5/3", expected: { kind: "fraction", numerator: -1, denominator: 3 } },
    { name: "adds integer with two fractions", input: "1 + 1/6 + 1/3", expected: { kind: "fraction", numerator: 3, denominator: 2 } },
    { name: "handles negative factor in fraction product", input: "-2/3 * 9/4", expected: { kind: "fraction", numerator: -3, denominator: 2 } },
    { name: "returns zero for product containing zero fraction", input: "0/3 * 5/7", expected: { kind: "number", value: 0 } },
    { name: "multiplies fraction chain and reduces", input: "(1/2) * (2/3) * (3/4)", expected: { kind: "fraction", numerator: 1, denominator: 4 } },
    { name: "keeps explicit denominator zero for one over zero", input: "1/0", expected: { kind: "fraction", numerator: 1, denominator: 0 } },
    { name: "keeps explicit denominator zero for zero over zero", input: "0/0", expected: { kind: "fraction", numerator: 0, denominator: 0 } },
    {
      name: "keeps nested fraction structure for chained division",
      input: "1/2/3",
      expected: { kind: "nestedFraction", fractionCount: 2, requiredTokens: ["1", "2", "3"] },
    },
  ];

  runSimplifyCaseGroup("edge", edgeCases);
});

describe("orbi-engine exponential simplify", () => {
  const exponentialCases: SimplifyCase[] = [
    { name: "computes integer power", input: "2^3", expected: { kind: "exponential", base: "2", power: 3 } },
    { name: "keeps variable base with power", input: "x^2", expected: { kind: "exponential", base: "x", power: 2 } },
    { name: "simplifies power of one to base", input: "x^1", expected: { kind: "exponential", base: "x", power: 1 } },
    { name: "simplifies power of zero", input: "x^0", expected: { kind: "exponential", base: "x", power: 0 } },
    { name: "handles parenthesized base", input: "(2+3)^2", expected: { kind: "exponential", base: "5", power: 2 } },
    { name: "[BUG] negative exponent should parse correctly", input: "x^(-2)", expected: { kind: "exponential", base: "x", power: -2 }, skip: true },
    { name: "handles fractional base", input: "(1/2)^2", expected: { kind: "raw", contains: ["math::Exponential", "math::Fraction"] } },
  ];

  runSimplifyCaseGroup("exp", exponentialCases);
});

describe("orbi-engine variable simplify", () => {
  const variableCases: SimplifyCase[] = [
    { name: "keeps single variable unchanged", input: "x", expected: { kind: "variable", name: "x", coefficient: 1 } },
    { name: "keeps variable with coefficient", input: "2x", expected: { kind: "variable", name: "x", coefficient: 2 } },
    { name: "handles negative coefficient", input: "-3x", expected: { kind: "raw", contains: ["-3", "x"] } },
    { name: "sums same variables", input: "x + x", expected: { kind: "variable", name: "x", coefficient: 2 } },
    { name: "sums coefficients of same variable", input: "2x + 3x", expected: { kind: "variable", name: "x", coefficient: 5 } },
    { name: "keeps different variables separate in sum", input: "x + y", expected: { kind: "sum", requiredTokens: ["x", "y"] } },
    { name: "multiplies variable coefficients", input: "2x * 3", expected: { kind: "variable", name: "x", coefficient: 6 } },
    { name: "creates exponential from variable product", input: "x * x", expected: { kind: "exponential", base: "x", power: 2 } },
    { name: "creates higher power from repeated multiplication", input: "x * x * x", expected: { kind: "exponential", base: "x", power: 3 } },
  ];

  runSimplifyCaseGroup("var", variableCases);
});

describe("orbi-engine mixed expressions", () => {
  const mixedCases: SimplifyCase[] = [
    { name: "combines integer and variable in sum", input: "5 + x", expected: { kind: "sum", requiredTokens: ["5", "x"] } },
    { name: "combines fraction and variable", input: "1/2 + x", expected: { kind: "sum", requiredTokens: ["math::Fraction", "x"] } },
    { name: "multiplies integer with fraction", input: "2 * (3/4)", expected: { kind: "fraction", numerator: 3, denominator: 2 } },
    { name: "distributes through parentheses conceptually", input: "2 * (x + 1)", expected: { kind: "raw", contains: ["2", "x", "1"] } },
    { name: "handles nested parentheses in sum", input: "((1 + 2) + 3)", expected: { kind: "number", value: 6 } },
    { name: "handles nested parentheses in product", input: "((2 * 3) * 4)", expected: { kind: "number", value: 24 } },
    { name: "preserves variable in fraction numerator", input: "x/2", expected: { kind: "fractionShape", requiredTokens: ["x", "2"] } },
    { name: "preserves variable in fraction denominator", input: "2/x", expected: { kind: "fractionShape", requiredTokens: ["2", "x"] } },
    { name: "handles expression with all operators", input: "1 + 2 * 3 - 4", expected: { kind: "number", value: 3 } },
  ];

  runSimplifyCaseGroup("mix", mixedCases);
});

describe("orbi-engine product simplify", () => {
  const productCases: SimplifyCase[] = [
    { name: "multiplies two integers", input: "6 * 7", expected: { kind: "number", value: 42 } },
    { name: "multiplies three integers", input: "2 * 3 * 5", expected: { kind: "number", value: 30 } },
    { name: "handles multiplication by zero", input: "999 * 0", expected: { kind: "number", value: 0 } },
    { name: "handles multiplication by one", input: "42 * 1", expected: { kind: "number", value: 42 } },
    { name: "handles negative multiplier", input: "-2 * 3", expected: { kind: "number", value: -6 } },
    { name: "[BUG] double negative product should simplify to positive", input: "-2 * -3", expected: { kind: "number", value: 6 }, skip: true },
    { name: "multiplies variable by integer", input: "3 * x", expected: { kind: "variable", name: "x", coefficient: 3 } },
    { name: "multiplies multiple variables of same name", input: "x * x * x", expected: { kind: "exponential", base: "x", power: 3 } },
    { name: "multiplies different variables", input: "x * y", expected: { kind: "product", requiredTokens: ["x", "y"] } },
  ];

  runSimplifyCaseGroup("prod", productCases);
});

describe("orbi-engine sum simplify", () => {
  const sumCases: SimplifyCase[] = [
    { name: "adds two integers", input: "10 + 20", expected: { kind: "number", value: 30 } },
    { name: "adds multiple integers", input: "1 + 2 + 3 + 4 + 5", expected: { kind: "number", value: 15 } },
    { name: "handles subtraction", input: "10 - 3", expected: { kind: "number", value: 7 } },
    { name: "handles multiple subtractions", input: "20 - 5 - 3", expected: { kind: "number", value: 12 } },
    { name: "handles mixed addition and subtraction", input: "10 + 5 - 3", expected: { kind: "number", value: 12 } },
    { name: "handles negative result", input: "5 - 10", expected: { kind: "raw", contains: ["-1", "5"] } },
    { name: "sums to zero", input: "5 - 5", expected: { kind: "number", value: 0 } },
    { name: "adds variable and integer", input: "x + 5", expected: { kind: "sum", requiredTokens: ["x", "5"] } },
    { name: "combines like variable terms", input: "3x + 2x - x", expected: { kind: "variable", name: "x", coefficient: 4 } },
  ];

  runSimplifyCaseGroup("sum", sumCases);
});

describe("orbi-engine complex algebraic expressions", () => {
  const complexCases: SimplifyCase[] = [
    { name: "polynomial-like: 2x + 3x + 5", input: "2x + 3x + 5", expected: { kind: "sum", requiredTokens: ["5x", "5"] } },
    { name: "polynomial with multiple terms", input: "x + 2x + 3 + 4", expected: { kind: "sum", requiredTokens: ["3x", "7"] } },
    { name: "multiple different variables", input: "x + y + z", expected: { kind: "sum", requiredTokens: ["x", "y", "z"] } },
    { name: "nested expression with fraction and variable", input: "(x + 1)/2", expected: { kind: "fractionShape", requiredTokens: ["x", "1", "2"] } },
    { name: "variable times fraction", input: "x * (1/2)", expected: { kind: "fractionShape", requiredTokens: ["x", "2"] } },
    { name: "fraction with variable denominator", input: "(x + y)/z", expected: { kind: "fractionShape", requiredTokens: ["x", "y", "z"] } },
    { name: "[BUG] triple-nested parentheses should evaluate correctly", input: "(((1 + 2)))", expected: { kind: "number", value: 3 }, skip: true },
    { name: "expression with whitespace", input: " 1  +  2  ", expected: { kind: "number", value: 3 } },
    { name: "large integer computation", input: "100 * 100", expected: { kind: "number", value: 10000 } },
    { name: "fraction chain simplification", input: "1/2 * 2/3 * 3/4 * 4/5", expected: { kind: "fraction", numerator: 1, denominator: 5 } },
  ];

  runSimplifyCaseGroup("complex", complexCases);
});

describe("orbi-engine operator precedence edge cases", () => {
  const precedenceCases: SimplifyCase[] = [
    { name: "addition vs multiplication: left", input: "1 + 2 * 3", expected: { kind: "number", value: 7 } },
    { name: "addition vs multiplication: right", input: "2 * 3 + 1", expected: { kind: "number", value: 7 } },
    { name: "subtraction vs multiplication", input: "10 - 2 * 3", expected: { kind: "number", value: 4 } },
    { name: "division creates fraction", input: "1/2", expected: { kind: "fraction", numerator: 1, denominator: 2 } },
    { name: "chained operations", input: "2 + 3 * 4 - 5", expected: { kind: "number", value: 9 } },
    { name: "parentheses override precedence", input: "(2 + 3) * (4 - 1)", expected: { kind: "number", value: 15 } },
    { name: "multiple levels of parentheses", input: "((2 + 3) * 4) - 5", expected: { kind: "number", value: 15 } },
    { name: "power has highest precedence", input: "2 * 3^2", expected: { kind: "raw", contains: ["2", "math::Exponential", "3", "2"] } },
  ];

  runSimplifyCaseGroup("prec", precedenceCases);
});

describe("orbi-engine fraction arithmetic comprehensive", () => {
  const fractionArithmeticCases: SimplifyCase[] = [
    { name: "proper fraction stays proper", input: "1/4", expected: { kind: "fraction", numerator: 1, denominator: 4 } },
    { name: "improper fraction stays improper", input: "5/3", expected: { kind: "fraction", numerator: 5, denominator: 3 } },
    { name: "equivalent fractions reduce", input: "50/100", expected: { kind: "fraction", numerator: 1, denominator: 2 } },
    { name: "large numbers reduce correctly", input: "24/36", expected: { kind: "fraction", numerator: 2, denominator: 3 } },
    { name: "prime numerator and denominator stay", input: "7/11", expected: { kind: "fraction", numerator: 7, denominator: 11 } },
    { name: "subtract fractions with different denominators", input: "3/4 - 1/3", expected: { kind: "fraction", numerator: 5, denominator: 12 } },
    { name: "multiply and reduce", input: "3/4 * 8/9", expected: { kind: "fraction", numerator: 2, denominator: 3 } },
    { name: "mixed number addition", input: "1 + 1/2 + 1/4", expected: { kind: "fraction", numerator: 7, denominator: 4 } },
  ];

  runSimplifyCaseGroup("fracarith", fractionArithmeticCases);
});
