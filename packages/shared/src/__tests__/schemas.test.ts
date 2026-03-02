import { describe, it, expect } from "vitest";
import { DoubleRequestSchema, DoubleResponseSchema } from "index.js";

describe("DoubleRequestSchema", () => {
  it("accepts valid request", () => {
    const result = DoubleRequestSchema.parse({ x: 5 });
    expect(result).toEqual({ x: 5 });
  });

  it("rejects non-integer", () => {
    expect(() => DoubleRequestSchema.parse({ x: 1.5 })).toThrow();
  });

  it("rejects missing x", () => {
    expect(() => DoubleRequestSchema.parse({})).toThrow();
  });
});

describe("DoubleResponseSchema", () => {
  it("accepts valid response", () => {
    const result = DoubleResponseSchema.parse({ result: 10 });
    expect(result).toEqual({ result: 10 });
  });

  it("rejects non-integer", () => {
    expect(() => DoubleResponseSchema.parse({ result: 1.5 })).toThrow();
  });
});
